import type { NewsDto } from '@everynews/schema'
import PQueue from 'p-queue'
import type { Curator } from './type'

export const HnBestCurator: Curator = async (
  news: NewsDto,
): Promise<string[]> => {
  const queue = new PQueue({
    concurrency: 3,
  })
  if (news.strategy.provider !== 'hnbest') {
    throw new Error(
      `HackerNewsCurator got News Strategy ${news.strategy.provider}`,
    )
  }

  // 2. Fetch the best stories from HackerNews
  const ids: string[] = await fetch(
    'https://hacker-news.firebaseio.com/v0/beststories.json',
  ).then((res) => res.json())

  // 3. Fetch individual URLs
  const items: string[] = await queue.addAll(
    ids.map((id: string) => async () => {
      console.log(`[HnBestCurator] Fetching ${id}`)
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      )
      const item = await response.json()
      console.log(`[HnBestCurator] Fetched ${id}`)
      return (
        String(item.url) ||
        `https://news.ycombinator.com/item?id=${String(item.id)}`
      )
    }),
  )

  console.log(`Fetched ${ids.length} URLs`)

  // 4. Return the first 3 URLs
  return items.slice(0, 3)
}
