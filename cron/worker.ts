import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import {
  type Alert,
  alerts,
  type Channel,
  type Content,
  StorySchema,
  type Subscription,
  stories,
  subscriptions,
  users,
} from '@everynews/schema'
import { curator } from '@everynews/subroutines/curator'
import { herald } from '@everynews/subroutines/herald'
import { reaper } from '@everynews/subroutines/reaper'
import { sage } from '@everynews/subroutines/sage'
import { and, eq, gte, isNull } from 'drizzle-orm'
import PQueue from 'p-queue'
import type { z } from 'zod'

// Constants
const TIMEOUTS = {
  CURATOR: 60 * 1000, // 1 minute
  HERALD: 30 * 1000, // 30 seconds
  REAPER: 3 * 60 * 1000, // 3 minutes
  SAGE: 60 * 1000, // 1 minute
} as const

const FAST_CHANNEL_TYPES = ['phone', 'push', 'slack', 'discord'] as const
type FastChannelType = (typeof FAST_CHANNEL_TYPES)[number]

// Type definitions
interface SubscriberWithChannel extends Subscription {
  channel: Channel | null
}

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

// Helper functions
const isFastChannel = (channelType: string): channelType is FastChannelType => {
  return FAST_CHANNEL_TYPES.includes(channelType as FastChannelType)
}

const classifySubscribers = (subscribers: SubscriberWithChannel[]) => {
  const fastChannelSubscribers: SubscriberWithChannel[] = []
  const slowChannelSubscribers: SubscriberWithChannel[] = []

  for (const subscriber of subscribers) {
    if (!subscriber.channel) {
      // No channel ID means default email channel (slow)
      slowChannelSubscribers.push(subscriber)
    } else if (isFastChannel(subscriber.channel.type)) {
      fastChannelSubscribers.push(subscriber)
    } else {
      // Slow channels: email
      slowChannelSubscribers.push(subscriber)
    }
  }

  return { fastChannelSubscribers, slowChannelSubscribers }
}

const fetchStoriesForChannel = async (
  alertId: string,
  lastSent: Date | null,
) => {
  return StorySchema.array().parse(
    await db.query.stories.findMany({
      where: and(
        isNull(stories.deletedAt),
        eq(stories.alertId, alertId),
        gte(stories.createdAt, lastSent ?? new Date(0)),
      ),
    }),
  )
}

const deliverToSubscribers = async (
  subscribers: SubscriberWithChannel[],
  storiesToSend: z.infer<typeof StorySchema>[],
  alert: Alert,
  allSubscribersCount: number,
  channelType: 'fast' | 'slow',
): Promise<boolean> => {
  let anySucceeded = false

  for (const subscriber of subscribers) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, subscriber.userId),
    })

    try {
      await withTimeout(
        herald({
          alertId: alert.id,
          alertName: alert.name,
          channelId: subscriber.channelId,
          readerCount: allSubscribersCount,
          stories: storiesToSend,
          strategy: alert.strategy,
          subscriptionId: subscriber.id,
          user,
          wait: alert.wait,
        }),
        TIMEOUTS.HERALD,
        `Herald timeout for user ${user?.email || 'unknown'}`,
      )
      anySucceeded = true
    } catch (error) {
      await track({
        channel: 'worker',
        description: `Failed to send to ${channelType} channel subscriber: ${error instanceof Error ? error.message : String(error)}`,
        event: `${channelType === 'fast' ? 'Fast' : 'Slow'} Channel Delivery Failed`,
        icon: '❌',
        tags: {
          alert_id: alert.id,
          alert_name: alert.name,
          channel_id: subscriber.channelId || 'unknown',
          error: String(error),
          subscriber_id: subscriber.id,
          type: 'error',
          user_email: user?.email || 'unknown',
        },
      })
    }
  }

  return anySucceeded
}

export const processAlert = async (item: Alert) => {
  await track({
    channel: 'worker',
    event: `Processing Alert "${item.name}"`,
    icon: '⚙️',
    tags: {
      alert_id: item.id,
      alert_name: item.name,
      strategy_provider: item.strategy.provider,
      type: 'info',
    },
  })

  // Content gathering pipeline
  const curatorResults = await withTimeout(
    curator(item),
    TIMEOUTS.CURATOR,
    `Curator timeout for alert: ${item.name}`,
  )
  const contents: Content[] = await withTimeout(
    reaper(curatorResults),
    TIMEOUTS.REAPER,
    `Reaper timeout for alert: ${item.name}`,
  )

  await withTimeout(
    sage({ contents, curatorResults, news: item }),
    TIMEOUTS.SAGE,
    `Sage timeout for alert: ${item.name}`,
  )

  // Fetch stories based on channel-specific last sent times
  const [slowChannelFilteredStories, fastChannelFilteredStories] =
    await Promise.all([
      fetchStoriesForChannel(item.id, item.slowLastSent),
      fetchStoriesForChannel(item.id, item.fastLastSent),
    ])

  // Get all subscriptions and separate by channel type
  const allSubscribers = (await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.alertId, item.id),
      isNull(subscriptions.deletedAt),
    ),
    with: {
      channel: true,
    },
  })) as SubscriberWithChannel[]

  const { fastChannelSubscribers, slowChannelSubscribers } =
    classifySubscribers(allSubscribers)

  await track({
    channel: 'worker',
    description: `Slow channels: ${slowChannelFilteredStories.length} new stories since slowLastSent. Fast channels: ${fastChannelFilteredStories.length} new stories since fastLastSent`,
    event: 'Stories Filtered by Channel Speed',
    icon: '🔍',
    tags: {
      alert_id: item.id,
      alert_name: item.name,
      fast_last_sent: item.fastLastSent?.toISOString() || 'null',
      fast_stories: fastChannelFilteredStories.length,
      fast_subscribers: fastChannelSubscribers.length,
      last_run: item.lastRun?.toISOString() || 'null',
      slow_last_sent: item.slowLastSent?.toISOString() || 'null',
      slow_stories: slowChannelFilteredStories.length,
      slow_subscribers: slowChannelSubscribers.length,
      type: 'info',
    },
  })

  // Update lastRun and calculate nextRun
  const currentTime = new Date()
  const nextRun = new Date(Date.now() + 60 * 60 * 1000)

  await db
    .update(alerts)
    .set({ lastRun: currentTime, nextRun })
    .where(eq(alerts.id, item.id))

  // Determine if we should send to each channel type
  const shouldSendSlowChannels =
    item.wait.type === 'count'
      ? slowChannelFilteredStories.length >= item.wait.value
      : shouldSendScheduledAlert(item.wait.value, item.slowLastSent)

  const shouldSendFastChannels = fastChannelFilteredStories.length > 0

  // Handle slow channel delivery
  let anySlowChannelSucceeded = false
  if (shouldSendSlowChannels && slowChannelSubscribers.length > 0) {
    // If HN Top, refresh scores and sort once for all slow-channel recipients
    let storiesForSlow = slowChannelFilteredStories
    if (item.strategy.provider === 'hntop' && storiesForSlow.length > 0) {
      const start = Date.now()
      const originalOrder = storiesForSlow
      const items = originalOrder.map((story, index) => ({
        hnId: story.metadata?.hackerNewsId as number | undefined,
        index,
        story,
      }))
      const ids = items
        .map((i) => i.hnId)
        .filter((id): id is number => typeof id === 'number')

      let usedFallback = false
      let hits = 0
      if (ids.length > 0) {
        const queue = new PQueue({ concurrency: 8 })
        const fetchWithTimeout = async (id: number) => {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 2000)
          try {
            const res = await fetch(
              `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
              { signal: controller.signal },
            )
            const json = (await res.json()) as any
            const score = typeof json?.score === 'number' ? json.score : null
            const time = typeof json?.time === 'number' ? json.time : 0
            if (score == null) return null
            return { id, score, time }
          } catch {
            return null
          } finally {
            clearTimeout(timeout)
          }
        }

        const results = await queue.addAll(
          ids.map((id) => () => fetchWithTimeout(id)),
        )
        const scoreMap = new Map<number, { score: number; time: number }>()
        for (const r of results)
          if (r) scoreMap.set(r.id, { score: r.score, time: r.time })
        hits = scoreMap.size

        if (hits > 0) {
          storiesForSlow = [...items]
            .sort((a, b) => {
              const sa =
                a.hnId != null ? (scoreMap.get(a.hnId)?.score ?? -1) : -1
              const sb =
                b.hnId != null ? (scoreMap.get(b.hnId)?.score ?? -1) : -1
              if (sb !== sa) return sb - sa
              const ta = a.hnId != null ? (scoreMap.get(a.hnId)?.time ?? 0) : 0
              const tb = b.hnId != null ? (scoreMap.get(b.hnId)?.time ?? 0) : 0
              if (tb !== ta) return tb - ta
              return a.index - b.index
            })
            .map((i) => i.story)
        } else {
          usedFallback = true
        }
      } else {
        usedFallback = true
      }

      await track({
        channel: 'worker',
        description: `HN Top: ${usedFallback ? 'fallback' : 'sorted by score'} for slow channels`,
        event: 'HN Top Sort Prepared',
        icon: usedFallback ? '⏭️' : '🏁',
        tags: {
          alert_id: item.id,
          alert_name: item.name,
          fetched_scores: hits,
          ms: Date.now() - start,
          requested_scores: ids.length,
          type: 'info',
        },
      })
    }

    await track({
      channel: 'worker',
      description: `Sending ${slowChannelFilteredStories.length} stories to ${slowChannelSubscribers.length} slow channel subscribers`,
      event: 'Slow Channel Alert Delivery Starting',
      icon: '🐌',
      tags: {
        alert_id: item.id,
        alert_name: item.name,
        stories_count: slowChannelFilteredStories.length,
        subscribers_count: slowChannelSubscribers.length,
        type: 'info',
      },
    })

    anySlowChannelSucceeded = await deliverToSubscribers(
      slowChannelSubscribers,
      storiesForSlow,
      item,
      allSubscribers.length,
      'slow',
    )
  } else if (slowChannelSubscribers.length > 0) {
    const skipReason =
      item.wait.type === 'count'
        ? `Found ${slowChannelFilteredStories.length} stories, waiting for ${item.wait.value}`
        : `Not in scheduled window or already sent this hour`

    await track({
      channel: 'worker',
      description: `Slow channels: ${skipReason}`,
      event: 'Slow Channel Alert Delivery Skipped',
      icon: '⏭️',
      tags: {
        alert_id: item.id,
        alert_name: item.name,
        slow_last_sent: item.slowLastSent?.toISOString() || 'never',
        stories_found: slowChannelFilteredStories.length,
        type: 'info',
        wait_threshold:
          item.wait.type === 'count' ? item.wait.value : 'schedule',
        wait_type: item.wait.type,
      },
    })
  }

  // Handle fast channel delivery
  let anyFastChannelSucceeded = false
  if (shouldSendFastChannels && fastChannelSubscribers.length > 0) {
    await track({
      channel: 'worker',
      description: `Sending ${fastChannelFilteredStories.length} stories to ${fastChannelSubscribers.length} fast channel subscribers`,
      event: 'Fast Channel Alert Delivery Starting',
      icon: '⚡',
      tags: {
        alert_id: item.id,
        alert_name: item.name,
        stories_count: fastChannelFilteredStories.length,
        subscribers_count: fastChannelSubscribers.length,
        type: 'info',
      },
    })

    anyFastChannelSucceeded = await deliverToSubscribers(
      fastChannelSubscribers,
      fastChannelFilteredStories,
      item,
      allSubscribers.length,
      'fast',
    )
  } else if (fastChannelSubscribers.length > 0) {
    await track({
      channel: 'worker',
      description: `Fast channels: No new stories since fastLastSent`,
      event: 'Fast Channel Alert Delivery Skipped',
      icon: '⏭️',
      tags: {
        alert_id: item.id,
        alert_name: item.name,
        stories_found: fastChannelFilteredStories.length,
        type: 'info',
      },
    })
  }

  // Update lastSent timestamps based on delivery results
  const updates: Partial<typeof alerts.$inferInsert> = {}
  if (anySlowChannelSucceeded) updates.slowLastSent = currentTime
  if (anyFastChannelSucceeded) updates.fastLastSent = currentTime

  if (Object.keys(updates).length > 0) {
    await db.update(alerts).set(updates).where(eq(alerts.id, item.id))
  }

  // Log if no subscribers found
  if (allSubscribers.length === 0) {
    await track({
      channel: 'worker',
      description: `No subscribers found for alert "${item.name}"`,
      event: 'No Subscribers Found',
      icon: '🔍',
      tags: {
        alert_id: item.id,
        alert_name: item.name,
        type: 'info',
      },
    })
  }

  // Final summary
  await track({
    channel: 'worker',
    description: `Completed processing: ${item.name} - Slow: ${shouldSendSlowChannels ? `sent ${slowChannelFilteredStories.length}` : `waiting (${slowChannelFilteredStories.length}/${item.wait.type === 'count' ? item.wait.value : '1'})`} to ${slowChannelSubscribers.length} subscribers. Fast: ${shouldSendFastChannels ? `sent ${fastChannelFilteredStories.length}` : 'no new'} to ${fastChannelSubscribers.length} subscribers`,
    event: 'Alert Processed',
    icon: '✅',
    tags: {
      alert_id: item.id,
      alert_name: item.name,
      fast_sent: shouldSendFastChannels && fastChannelSubscribers.length > 0,
      fast_stories: fastChannelFilteredStories.length,
      fast_subscribers: fastChannelSubscribers.length,
      next_run: nextRun?.toISOString() || 'unknown',
      slow_sent:
        shouldSendSlowChannels && slowChannelSubscribers.length > 0
          ? 'true'
          : 'false',
      slow_stories: slowChannelFilteredStories.length,
      slow_subscribers: slowChannelSubscribers.length,
      type: 'info',
      urls_found: curatorResults.length,
      wait_type: item.wait.type,
    },
  })
}

const shouldSendScheduledAlert = (
  schedule: string,
  lastSent: Date | null,
): boolean => {
  const { days, hours } =
    typeof schedule === 'string' ? JSON.parse(schedule) : schedule
  const now = new Date()
  const currentDayName = now.toLocaleString('en-us', { weekday: 'long' })
  const currentHour = now.getHours()

  // Check if today is a scheduled day
  if (!days.includes(currentDayName)) {
    return false
  }

  // Check if current hour is in the scheduled hours
  if (!hours.includes(currentHour)) {
    return false
  }

  // If we've never sent before, send now
  if (!lastSent) {
    return true
  }

  // Check if we've already sent during this scheduled window
  // A scheduled window is defined as the same day and hour
  const lastSentDay = lastSent.toLocaleString('en-us', { weekday: 'long' })
  const lastSentHour = lastSent.getHours()

  // If we sent on the same day and hour, don't send again
  if (
    lastSentDay === currentDayName &&
    lastSentHour === currentHour &&
    lastSent.toDateString() === now.toDateString()
  ) {
    return false
  }

  return true
}
