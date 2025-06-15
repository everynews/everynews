import { track } from '@everynews/logs'
import type { Alert, Story } from '@everynews/schema'
import { curator } from './curator'
import { reaper } from './reaper'
import { sage } from './sage'

/**
 * Aspirant is a test version of the sage workflow that:
 * 1. Uses curator to get top 3 URLs
 * 2. Uses reaper to fetch content
 * 3. Uses sage to summarize content
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
    await track({
      channel: 'aspirant',
      description: `Selected ${urls.length} URLs for testing`,
      event: 'URLs Selected',
      icon: '📋',
      tags: {
        alert_id: alert.id,
        selected_count: urls.length,
        total_count: urls.length,
        type: 'info',
      },
    })

    const contents = await reaper(urls)

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

    const stories = await sage({ contents, news: alert })

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
