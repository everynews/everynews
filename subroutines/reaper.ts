import { track } from '@everynews/logs'
import type { Content } from '@everynews/schema'
import PQueue from 'p-queue'
import type { CuratorResult } from './curators/type'
import { reap } from './reapers'

export const reaper = async (
  curatorResults: CuratorResult[],
): Promise<Content[]> => {
  try {
    await track({
      channel: 'reaper',
      description: `Starting to crawl ${curatorResults.length} URLs`,
      event: 'Reaping Started',
      icon: '🕷️',
      tags: {
        type: 'info',
        url_count: curatorResults.length,
      },
    })

    const queue = new PQueue({ concurrency: 16 })
    const results = await Promise.all(
      curatorResults.map(async (result) => {
        try {
          return await queue.add(() => reap(result.url))
        } catch (error) {
          console.error(`Failed to process URL: ${result.url}`, error)
          await track({
            channel: 'reaper',
            description: result.url,
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
      description: `Crawled ${filteredResults.length}/${curatorResults.length} URLs`,
      event: 'Reaping Completed',
      icon: '✅',
      tags: {
        success_rate: Math.round(
          (filteredResults.length / curatorResults.length) * 100,
        ),
        type: 'info',
        urls_attempted: curatorResults.length,
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
        url_count: curatorResults.length,
      },
    })
    throw error
  }
}
