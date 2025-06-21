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
import { eq } from 'drizzle-orm'

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

  const urls = await curator(item)
  const contents: Content[] = await reaper(urls)
  const stories = await sage({ contents, news: item })

  // Filter stories to only include those created since lastRun and not marked as irrelevant
  const filteredStories = stories.filter((story) => {
    // Filter out both user-marked and system-marked irrelevant stories
    if (story.userMarkedIrrelevant || story.systemMarkedIrrelevant) {
      return false
    }
    if (!item.lastRun) return true // If no lastRun, include all stories
    return story.createdAt > item.lastRun
  })

  await track({
    channel: 'worker',
    description: `Filtered ${filteredStories.length}/${stories.length} stories created since last run`,
    event: 'Stories Filtered by lastRun',
    icon: '🔍',
    tags: {
      alert_id: item.id,
      alert_name: item.name,
      last_run: item.lastRun?.toISOString() || 'null',
      stories_filtered: filteredStories.length,
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

  // Determine if we should send based on wait conditions
  let shouldSend = false
  if (item.wait.type === 'count') {
    // For count type, only send when we have enough stories
    shouldSend = filteredStories.length >= item.wait.value
  } else {
    // For schedule type, send if there are any new stories
    shouldSend = filteredStories.length > 0
  }

  if (shouldSend) {
    // Send email to the all subscribers of the alert
    const subscribers = await db.query.subscriptions.findMany({
      where: eq(subscriptions.alertId, item.id),
    })

    const readerCount = subscribers.length

    for (const subscriber of subscribers) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, subscriber.userId),
      })
      await herald({
        alertName: item.name,
        channelId: subscriber.channelId,
        readerCount,
        stories: filteredStories,
        strategy: item.strategy,
        user,
        wait: item.wait,
      })
    }
  } else {
    await track({
      channel: 'worker',
      description:
        item.wait.type === 'count'
          ? `Found ${filteredStories.length} stories, waiting for ${item.wait.value} - skipping alert delivery`
          : `No new stories since last run - skipping alert delivery`,
      event: 'Alert Delivery Skipped',
      icon: '⏭️',
      tags: {
        alert_id: item.id,
        alert_name: item.name,
        last_run: item.lastRun?.toISOString() || 'null',
        stories_found: filteredStories.length,
        type: 'info',
        wait_threshold: item.wait.type === 'count' ? item.wait.value : 'n/a',
      },
    })
  }

  await track({
    channel: 'worker',
    description: `Completed processing: ${item.name} - Found ${stories.length} stories, sent ${filteredStories.length} new stories`,
    event: 'Alert Processed',
    icon: '✅',
    tags: {
      alert_id: item.id,
      alert_name: item.name,
      next_run: nextRun?.toISOString() || 'unknown',
      stories_created: stories.length,
      stories_sent: filteredStories.length,
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
