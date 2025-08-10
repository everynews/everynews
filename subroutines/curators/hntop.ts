import { track } from '@everynews/logs'
import type { Alert } from '@everynews/schema'
import PQueue from 'p-queue'
import z from 'zod'
import type { Curator, CuratorResult } from './type'

const HackerNewsStoriesSchema = z.array(z.number())

const HackerNewsStorySchema = z.object({
  by: z.string(),
  id: z.number(),
  score: z.number(),
  time: z.number(),
  title: z.string(),
  type: z.string(),
  url: z.string().optional(),
})

export const HnTopCurator: Curator = async (
  alert: Alert,
): Promise<CuratorResult[]> => {
  const queue = new PQueue({
    concurrency: 16,
  })
  if (alert.strategy.provider !== 'hntop') {
    throw new Error(
      `HackerNewsCurator got Alert Strategy ${alert.strategy.provider}`,
    )
  }

  const controller1 = new AbortController()
  const timeout1 = setTimeout(() => controller1.abort(), 15000) // 15 second timeout

  let ids: number[]
  try {
    const response = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { signal: controller1.signal },
    )
    ids = await HackerNewsStoriesSchema.parse(await response.json())
  } finally {
    clearTimeout(timeout1)
  }

  // Fetch all items with their metadata
  const itemsWithMetadata = await queue.addAll(
    ids.map((id: number) => async () => {
      const controller2 = new AbortController()
      const timeout2 = setTimeout(() => controller2.abort(), 10000) // 10 second timeout per story

      try {
        const response = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { signal: controller2.signal },
        )
        const item = await HackerNewsStorySchema.parse(await response.json())
        return {
          id: item.id,
          time: item.time,
          url:
            item.url ||
            `https://news.ycombinator.com/item?id=${String(item.id)}`,
        }
      } catch (error) {
        await track({
          channel: 'curator',
          description: `Error fetching Hacker News story ${id}`,
          event: 'Hacker News Story Fetch Error',
          icon: '🚫',
          tags: {
            alert_id: alert.id,
            alert_name: alert.name,
            error: error instanceof Error ? error.message : String(error),
            provider: alert.strategy.provider,
            type: 'error',
          },
        })
        return null
      } finally {
        clearTimeout(timeout2)
      }
    }),
  )

  // Sort by time (most recent first) and create results with metadata
  const sortedResults = itemsWithMetadata
    .filter(
      (item): item is { id: number; time: number; url: string } =>
        item !== null,
    )
    .sort((a, b) => b.time - a.time)
    .slice(0, 10)
    .map((item) => ({
      metadata: { hackerNewsId: item.id },
      url: item.url,
    }))

  return sortedResults
}
