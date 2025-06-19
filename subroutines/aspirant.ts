import { nanoid } from '@everynews/lib/id'
import { track } from '@everynews/logs'
import type { Alert, Story } from '@everynews/schema'
import PQueue from 'p-queue'
import { curator } from './curator'
import { reaper } from './reaper'
import { summarizeContent } from './sage'

/**
 * Aspirant is a test version of the sage workflow that:
 * 1. Uses curator to get top 3 URLs
 * 2. Uses reaper to fetch content
 * 3. Uses summarizeContent to get summaries without database operations
 * 4. Returns stories without sending to herald
 */
export const aspirant = async (alert: Alert): Promise<Story[]> => {
  try {
    await track({
      channel: 'aspirant',
      description: `Starting test run for alert: ${alert.name}`,
      event: 'Aspirant Test Started',
      icon: '🧪',
      tags: {
        alert_id: alert.id,
        alert_name: alert.name,
        type: 'info',
      },
    })

    const urls = await curator(alert)
    const limitedUrls = urls.slice(0, 10)

    await track({
      channel: 'aspirant',
      description: `Selected ${limitedUrls.length} URLs for testing`,
      event: 'URLs Selected',
      icon: '📋',
      tags: {
        alert_id: alert.id,
        selected_count: limitedUrls.length,
        total_count: urls.length,
        type: 'info',
      },
    })

    const contents = await reaper(limitedUrls)

    await track({
      channel: 'aspirant',
      description: `Fetched ${contents.length} content items`,
      event: 'Content Fetched',
      icon: '📄',
      tags: {
        alert_id: alert.id,
        content_count: contents.length,
        type: 'info',
      },
    })

    const queue = new PQueue({ concurrency: 16 })
    const summaryPromises = contents.map((content) =>
      queue.add(async () => summarizeContent({ content, news: alert })),
    )

    const summaryResults = await Promise.all(summaryPromises)

    const stories: Story[] = []
    for (const summary of summaryResults) {
      if (summary) {
        const now = new Date()
        stories.push({
          createdAt: now,
          id: nanoid(),
          updatedAt: now,
          ...summary,
        })
      }
    }

    await track({
      channel: 'aspirant',
      description: `Generated ${stories.length} stories for test preview`,
      event: 'Aspirant Test Completed',
      icon: '✅',
      tags: {
        alert_id: alert.id,
        stories_count: stories.length,
        type: 'info',
      },
    })

    return stories
  } catch (error) {
    await track({
      channel: 'aspirant',
      description: `Test run failed for alert: ${alert.name}`,
      event: 'Aspirant Test Failed',
      icon: '❌',
      tags: {
        alert_id: alert.id,
        alert_name: alert.name,
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}
