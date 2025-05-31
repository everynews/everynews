import type { NewsDto } from '@everynews/schema'
import type { Curator } from './type'

export class HackerNewsCurator implements Curator {
  private static instance: HackerNewsCurator

  static get(): HackerNewsCurator {
    if (!HackerNewsCurator.instance) {
      HackerNewsCurator.instance = new HackerNewsCurator()
    }
    return HackerNewsCurator.instance
  }

  private async fetchBestStories(): Promise<number[]> {
    const response = await fetch(
      'https://hacker-news.firebaseio.com/v0/beststories.json',
    )
    return response.json()
  }

  private async fetchStoryDetails(
    id: number,
  ): Promise<{ url?: string; id?: string }> {
    const response = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
    )
    return response.json()
  }

  private getStoryUrl(item: { url?: string; id?: string }): string {
    return item.url || `https://news.ycombinator.com/item?id=${item.id}`
  }

  async run(news: NewsDto): Promise<string[]> {
    if (news.strategy.provider !== 'hnbest') {
      throw new Error(
        `HackerNewsCurator got News Strategy ${news.strategy.provider}`,
      )
    }

    const ids = await this.fetchBestStories()
    const items = await Promise.all(ids.map(this.fetchStoryDetails))
    return items.map(this.getStoryUrl)
  }
}
