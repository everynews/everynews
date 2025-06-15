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

    // Step 1: Get URLs from curator (limited to 3)
    const urls = await curator(alert)
    const limitedUrls = urls.slice(0, 3)

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

    // Step 2: Fetch content using reaper
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

    // Step 3: Summarize content using summarizeContent (without DB operations)
    const queue = new PQueue({ concurrency: 3 })
    const summaryPromises = contents.map((content) =>
      queue.add(async () => summarizeContent({ content, news: alert })),
    )

    const summaryResults = await Promise.all(summaryPromises)

    // Filter out null/undefined results and create temporary Story objects
    const stories: Story[] = []
    for (const summary of summaryResults) {
      if (summary) {
        stories.push({
          alertId: summary.alertId,
          contentId: summary.contentId,
          createdAt: new Date(),
          id: nanoid(),
          keyFindings: summary.keyFindings,
          languageCode: summary.languageCode,
          promptId: summary.promptId,
          title: summary.title,
          updatedAt: new Date(),
          url: summary.url,
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
