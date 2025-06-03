import type { Content } from '@everynews/schema'
import { track } from '@everynews/logs'
import PQueue from 'p-queue'
import { firecrawl } from './reapers/firecrawl'

export const reaper = async (urls: string[]): Promise<Content[]> => {
  try {
    await track({
      channel: 'reaper',
      description: `Starting to crawl ${urls.length} URLs`,
      event: 'Reaping Started',
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
          await track({
            channel: 'reaper',
            description: `Failed to crawl: ${url}`,
            event: 'URL Crawl Failed',
            icon: '❌',
            tags: {
              error: String(error),
              url,
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

    await track({
      channel: 'reaper',
      description: `Successfully crawled ${filteredResults.length}/${urls.length} URLs`,
      event: 'Reaping Completed',
      icon: '✅',
      tags: {
        success_rate: Math.round((filteredResults.length / urls.length) * 100),
        urls_attempted: urls.length,
        urls_successful: filteredResults.length,
      },
    })

    return filteredResults
  } catch (error) {
    await track({
      channel: 'reaper',
      description: `Reaping process failed: ${String(error)}`,
      event: 'Reaping Failed',
      icon: '💥',
      tags: {
        error: String(error),
        url_count: urls.length,
      },
    })
    throw error
  }
}
