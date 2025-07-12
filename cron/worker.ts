import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import {
  type Alert,
  alerts,
  type Content,
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
    with: {
      channel: true,
    },
  })

  // Separate subscribers by channel speed type
  const fastChannelSubscribers = []
  const slowChannelSubscribers = []

  for (const subscriber of allSubscribers) {
    if (!subscriber.channel) {
      // No channel ID means default email channel (slow)
      slowChannelSubscribers.push(subscriber)
    } else {
      // Fast channels: phone, push, slack, discord, etc.
      if (
        subscriber.channel.type === 'phone' ||
        subscriber.channel.type === 'push' ||
        subscriber.channel.type === 'slack' ||
        subscriber.channel.type === 'discord'
      ) {
        fastChannelSubscribers.push(subscriber)
      } else {
        // Slow channels: email
        slowChannelSubscribers.push(subscriber)
      }
    }
  }

  // Filter stories for slow channels (since slowLastSent)
  const slowChannelFilteredStories = stories.filter((story) => {
    if (story.userMarkedIrrelevant || story.systemMarkedIrrelevant) {
      return false
    }
    if (!item.slowLastSent) return true
    return story.createdAt > item.slowLastSent
  })

  // Filter stories for fast channels (since fastLastSent)
  const fastChannelFilteredStories = stories.filter((story) => {
    if (story.userMarkedIrrelevant || story.systemMarkedIrrelevant) {
      return false
    }
    if (!item.fastLastSent) return true
    return story.createdAt > item.fastLastSent
  })

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
      stories_total: stories.length,
      type: 'info',
    },
  })

  // Update lastRun to current time before setting nextRun
  const currentTime = new Date()

  const nextRun = new Date(Date.now() + 60 * 60 * 1000)

  await db
    .update(alerts)
    .set({ lastRun: currentTime, nextRun })
    .where(eq(alerts.id, item.id))

  const shouldSendSlowChannels =
    item.wait.type === 'count'
      ? slowChannelFilteredStories.length >= item.wait.value
      : shouldSendScheduledAlert(item.wait.value, item.slowLastSent)

  // Fast channels always send immediately if there are new stories
  const shouldSendFastChannels = fastChannelFilteredStories.length > 0

  let anySlowChannelSucceeded = false
  let anyFastChannelSucceeded = false

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

      try {
        await withTimeout(
          herald({
            alertId: item.id,
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
        anySlowChannelSucceeded = true
      } catch (error) {
        await track({
          channel: 'worker',
          description: `Failed to send to slow channel subscriber: ${error instanceof Error ? error.message : String(error)}`,
          event: 'Slow Channel Delivery Failed',
          icon: '❌',
          tags: {
            alert_id: item.id,
            alert_name: item.name,
            channel_id: subscriber.channelId || 'unknown',
            error: String(error),
            subscriber_id: subscriber.id,
            type: 'error',
            user_email: user?.email || 'unknown',
          },
        })
      }
    }
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

      try {
        await withTimeout(
          herald({
            alertId: item.id,
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
        anyFastChannelSucceeded = true
      } catch (error) {
        await track({
          channel: 'worker',
          description: `Failed to send to fast channel subscriber: ${error instanceof Error ? error.message : String(error)}`,
          event: 'Fast Channel Delivery Failed',
          icon: '❌',
          tags: {
            alert_id: item.id,
            alert_name: item.name,
            channel_id: subscriber.channelId || 'unknown',
            error: String(error),
            subscriber_id: subscriber.id,
            type: 'error',
            user_email: user?.email || 'unknown',
          },
        })
      }
    }
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

  // Update lastSent fields based on what was actually sent
  const updates: { slowLastSent?: Date; fastLastSent?: Date } = {}
  if (
    shouldSendSlowChannels &&
    slowChannelSubscribers.length > 0 &&
    anySlowChannelSucceeded
  ) {
    updates.slowLastSent = currentTime
  }
  if (
    shouldSendFastChannels &&
    fastChannelSubscribers.length > 0 &&
    anyFastChannelSucceeded
  ) {
    updates.fastLastSent = currentTime
  }
  if (Object.keys(updates).length > 0) {
    await db.update(alerts).set(updates).where(eq(alerts.id, item.id))
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
      slow_sent:
        shouldSendSlowChannels && slowChannelSubscribers.length > 0
          ? 'true'
          : 'false',
      slow_stories: slowChannelFilteredStories.length,
      slow_subscribers: slowChannelSubscribers.length,
      stories_total: stories.length,
      type: 'info',
      urls_found: urls.length,
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
