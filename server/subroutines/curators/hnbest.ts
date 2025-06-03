import type { NewsDto } from '@everynews/schema'
import PQueue from 'p-queue'
import z from 'zod'
import type { Curator } from './type'

const HackerNewsStoriesSchema = z.array(z.number())

const HackerNewsStorySchema = z.object({
  by: z.string(),
  descendants: z.number(),
  id: z.number(),
  kids: z.array(z.number()),
  score: z.number(),
  time: z.number(),
  title: z.string(),
  type: z.string(),
  url: z.string().optional(),
})

export const HnBestCurator: Curator = async (
  news: NewsDto,
): Promise<string[]> => {
  const queue = new PQueue({
    concurrency: 8,
  })
  if (news.strategy.provider !== 'hnbest') {
    throw new Error(
      `HackerNewsCurator got News Strategy ${news.strategy.provider}`,
    )
  }

  const response = await fetch(
    'https://hacker-news.firebaseio.com/v0/beststories.json',
  )
  const ids = await HackerNewsStoriesSchema.parse(await response.json())

  const items: string[] = await queue.addAll(
    ids.map((id: number) => async () => {
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      )
      const item = await HackerNewsStorySchema.parse(await response.json())
      return (
        item.url || `https://news.ycombinator.com/item?id=${String(item.id)}`
      )
    }),
  )

  return items.filter((item): item is string => Boolean(item))
}
