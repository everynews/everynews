import type { ContentDto } from '@everynews/schema'
import PQueue from 'p-queue'
import { firecrawl } from './reapers/firecrawl'

export const reaper = async (urls: string[]): Promise<ContentDto[]> => {
  const queue = new PQueue({ concurrency: 3 })
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        return await queue.add(() => firecrawl(url))
      } catch (error) {
        console.error(`Failed to process URL: ${url}`, error)
        return null
      }
    }),
  )
  return results.filter(
    (result): result is Awaited<ReturnType<typeof firecrawl>> =>
      result !== null,
  )
}
