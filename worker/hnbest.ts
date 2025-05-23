import type { StoryDto, Strategy } from '@everynews/schema'

import { z } from 'zod'
import { summarize } from './summarize'

const HackerNewsResponse = z.array(z.number())

const HackerNewsItemSchema = z.object({
  by: z.string(),
  descendants: z.number(),
  id: z.number(),
  kids: z.array(z.number()),
  score: z.number(),
  time: z.number(),
  title: z.string(),
  type: z.literal('story'),
  url: z.string().url().optional(),
})

export const hnbest = {
  run: async (_s: Extract<Strategy, { provider: 'hnbest' }>) => {
    const res = await fetch(
      'https://hacker-news.firebaseio.com/v0/beststories.json',
    )
    const data = HackerNewsResponse.parse(await res.json())

    const items = await Promise.all(
      data.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`),
      ),
    )

    const parsedItems = await Promise.all(
      items.map(async (item) => HackerNewsItemSchema.parse(await item.json())),
    )

    const basicItems = parsedItems.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
    }))

    const itemsWithSummaries: StoryDto[] = []
    return itemsWithSummaries
  },
}
