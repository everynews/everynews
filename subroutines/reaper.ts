import { track } from '@everynews/logs'
import type { Content } from '@everynews/schema'
import PQueue from 'p-queue'
import { reap } from './reapers'

export const reaper = async (urls: string[]): Promise<Content[]> => {
  try {
    await track({
      channel: 'reaper',
      description: `Starting to crawl ${urls.length} URLs`,
      event: 'Reaping Started',
      icon: '🕷️',
      tags: {
        type: 'info',
        url_count: urls.length,
      },
    })

    const queue = new PQueue({ concurrency: 16 })
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          return await queue.add(() => reap(url))
        } catch (error) {
          console.error(`Failed to process URL: ${url}`, error)
          await track({
            channel: 'reaper',
            description: url,
            event: 'URL Crawl Failed',
            icon: '❌',
            tags: {
              error: String(error),
              type: 'error',
            },
          })
          return null
        }
      }),
    )

    const filteredResults = results.filter(
      (result): result is Awaited<ReturnType<typeof reap>> => result !== null,
    ) as Content[]

    await track({
      channel: 'reaper',
      description: `Crawled ${filteredResults.length}/${urls.length} URLs`,
      event: 'Reaping Completed',
      icon: '✅',
      tags: {
        success_rate: Math.round((filteredResults.length / urls.length) * 100),
        type: 'info',
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
        type: 'error',
        url_count: urls.length,
      },
    })
    throw error
  }
}
