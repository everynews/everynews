import type { Content } from '@everynews/schema'
import { trackEvent } from '@everynews/server/lib/logsnag'
import PQueue from 'p-queue'
import { firecrawl } from './reapers/firecrawl'

export const reaper = async (urls: string[]): Promise<Content[]> => {
  try {
    await trackEvent({
      channel: 'reaper',
      event: 'Reaping Started',
      description: `Starting to crawl ${urls.length} URLs`,
      icon: '🕷️',
      tags: {
        url_count: urls.length,
      },
    })

    const queue = new PQueue({ concurrency: 3 })
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          return await queue.add(() => firecrawl(url))
        } catch (error) {
          console.error(`Failed to process URL: ${url}`, error)
          await trackEvent({
            channel: 'reaper',
            event: 'URL Crawl Failed',
            description: `Failed to crawl: ${url}`,
            icon: '❌',
            tags: {
              url,
              error: String(error),
            },
          })
          return null
        }
      }),
    )
    
    const filteredResults = results.filter(
      (result): result is Awaited<ReturnType<typeof firecrawl>> =>
        result !== null,
    )

    await trackEvent({
      channel: 'reaper',
      event: 'Reaping Completed',
      description: `Successfully crawled ${filteredResults.length}/${urls.length} URLs`,
      icon: '✅',
      tags: {
        urls_attempted: urls.length,
        urls_successful: filteredResults.length,
        success_rate: Math.round((filteredResults.length / urls.length) * 100),
      },
    })

    return filteredResults
  } catch (error) {
    await trackEvent({
      channel: 'reaper',
      event: 'Reaping Failed',
      description: `Reaping process failed: ${String(error)}`,
      icon: '💥',
      tags: {
        url_count: urls.length,
        error: String(error),
      },
    })
    throw error
  }
}
