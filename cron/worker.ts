import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import {
  type Alert,
  alerts,
  type Content,
  channels,
  subscriptions,
  users,
} from '@everynews/schema'
import { curator } from '@everynews/subroutines/curator'
import { herald } from '@everynews/subroutines/herald'
import { reaper } from '@everynews/subroutines/reaper'
import { sage } from '@everynews/subroutines/sage'
import { and, eq, isNull } from 'drizzle-orm'

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

  const urls = await withTimeout(
    curator(item),
    60 * 1000, // 1 minute for curator
    `Curator timeout for alert: ${item.name}`,
  )
  const contents: Content[] = await withTimeout(
    reaper(urls),
    3 * 60 * 1000, // 3 minutes for reaper
    `Reaper timeout for alert: ${item.name}`,
  )
  const stories = await withTimeout(
    sage({ contents, news: item }),
    60 * 1000, // 1 minute for sage
    `Sage timeout for alert: ${item.name}`,
  )

  // Get all subscriptions and separate by channel type
  const allSubscribers = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.alertId, item.id),
      isNull(subscriptions.deletedAt),
    ),
  })

  // Separate subscribers by channel speed type
  const fastChannelSubscribers = []
  const slowChannelSubscribers = []

  for (const subscriber of allSubscribers) {
    if (!subscriber.channelId) {
      // No channel ID means default email channel (slow)
      slowChannelSubscribers.push(subscriber)
    } else {
      const channel = await db.query.channels.findFirst({
        where: and(
          eq(channels.id, subscriber.channelId),
          isNull(channels.deletedAt),
        ),
      })
      // Fast channels: phone, push, slack, etc.
      if (
        channel?.type === 'phone' ||
        channel?.type === 'push' ||
        channel?.type === 'slack'
      ) {
        fastChannelSubscribers.push(subscriber)
      } else {
        // Slow channels: email
        slowChannelSubscribers.push(subscriber)
      }
    }
  }

  // Filter stories for slow channels (since lastSent)
  const slowChannelFilteredStories = stories.filter((story) => {
    if (story.userMarkedIrrelevant || story.systemMarkedIrrelevant) {
      return false
    }
    if (!item.lastSent) return true
    return story.createdAt > item.lastSent
  })

  // Filter stories for fast channels (since lastRun)
  const fastChannelFilteredStories = stories.filter((story) => {
    if (story.userMarkedIrrelevant || story.systemMarkedIrrelevant) {
      return false
    }
    if (!item.lastRun) return true
    return story.createdAt > item.lastRun
  })

  await track({
    channel: 'worker',
    description: `Slow channels: ${slowChannelFilteredStories.length} new stories since lastSent. Fast channels: ${fastChannelFilteredStories.length} new stories since lastRun`,
    event: 'Stories Filtered by Channel Speed',
    icon: '🔍',
    tags: {
      alert_id: item.id,
      alert_name: item.name,
      fast_stories: fastChannelFilteredStories.length,
      fast_subscribers: fastChannelSubscribers.length,
      last_run: item.lastRun?.toISOString() || 'null',
      last_sent: item.lastSent?.toISOString() || 'null',
      slow_stories: slowChannelFilteredStories.length,
      slow_subscribers: slowChannelSubscribers.length,
      stories_total: stories.length,
      type: 'info',
    },
  })

  // Update lastRun to current time before setting nextRun
  const currentTime = new Date()

  let nextRun: Date | null = null
  if (item.wait.type === 'count') {
    nextRun = new Date(Date.now() + 60 * 60 * 1000)
    await db
      .update(alerts)
      .set({ lastRun: currentTime, nextRun })
      .where(eq(alerts.id, item.id))
  }
  if (item.wait.type === 'schedule') {
    nextRun = findNextRunDateBasedOnSchedule(item.wait.value)
    await db
      .update(alerts)
      .set({ lastRun: currentTime, nextRun })
      .where(eq(alerts.id, item.id))
  }

  // Calculate whether to send for each channel type
  const shouldSendSlowChannels =
    item.wait.type === 'count'
      ? slowChannelFilteredStories.length >= item.wait.value
      : slowChannelFilteredStories.length > 0

  // Fast channels always send immediately if there are new stories
  const shouldSendFastChannels = fastChannelFilteredStories.length > 0

  let anySent = false

  // Send to slow channel subscribers if conditions are met
  if (shouldSendSlowChannels && slowChannelSubscribers.length > 0) {
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

    for (const subscriber of slowChannelSubscribers) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, subscriber.userId),
      })
      await withTimeout(
        herald({
          alertName: item.name,
          channelId: subscriber.channelId,
          readerCount: allSubscribers.length,
          stories: slowChannelFilteredStories,
          strategy: item.strategy,
          subscriptionId: subscriber.id,
          user,
          wait: item.wait,
        }),
        30 * 1000,
        `Herald timeout for user ${user?.email || 'unknown'}`,
      )
    }
    anySent = true
  } else if (slowChannelSubscribers.length > 0) {
    await track({
      channel: 'worker',
      description:
        item.wait.type === 'count'
          ? `Slow channels: Found ${slowChannelFilteredStories.length} stories, waiting for ${item.wait.value}`
          : `Slow channels: No new stories since last sent`,
      event: 'Slow Channel Alert Delivery Skipped',
      icon: '⏭️',
      tags: {
        alert_id: item.id,
        alert_name: item.name,
        stories_found: slowChannelFilteredStories.length,
        type: 'info',
        wait_threshold: item.wait.type === 'count' ? item.wait.value : 'n/a',
      },
    })
  }

  // Send to fast channel subscribers immediately if there are new stories
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

    for (const subscriber of fastChannelSubscribers) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, subscriber.userId),
      })
      await withTimeout(
        herald({
          alertName: item.name,
          channelId: subscriber.channelId,
          readerCount: allSubscribers.length,
          stories: fastChannelFilteredStories,
          strategy: item.strategy,
          subscriptionId: subscriber.id,
          user,
          wait: item.wait,
        }),
        30 * 1000,
        `Herald timeout for user ${user?.email || 'unknown'}`,
      )
    }
    anySent = true
  } else if (fastChannelSubscribers.length > 0) {
    await track({
      channel: 'worker',
      description: `Fast channels: No new stories since last run`,
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

  // Update lastSent only if any messages were actually sent
  if (anySent) {
    await db
      .update(alerts)
      .set({ lastSent: currentTime })
      .where(eq(alerts.id, item.id))
  }

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
      slow_sent: shouldSendSlowChannels && slowChannelSubscribers.length > 0,
      slow_stories: slowChannelFilteredStories.length,
      slow_subscribers: slowChannelSubscribers.length,
      stories_total: stories.length,
      type: 'info',
      urls_found: urls.length,
      wait_type: item.wait.type,
    },
  })
}

const findNextRunDateBasedOnSchedule = (schedule: string) => {
  const { days, hours } =
    typeof schedule === 'string' ? JSON.parse(schedule) : schedule
  const sortedHours = [...hours].sort((a, b) => a - b)
  const now = new Date()

  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + offset)
    const dayName = candidate.toLocaleString('en-us', { weekday: 'long' })
    if (!days.includes(dayName)) continue

    for (const h of sortedHours) {
      candidate.setHours(h, 0, 0, 0)
      if (candidate > now) return candidate
    }
  }

  return null
}
