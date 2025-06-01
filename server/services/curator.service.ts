import type { News, NewsDto } from '@everynews/schema'
import { ExaCurator } from './curators/exa.curator'
import { HackerNewsCurator } from './curators/hnbest.curator'
import type { Curator } from './curators/type'
import { ReaperService } from './reaper.service'

export class CuratorService {
  private static instance: CuratorService
  private curators: Record<string, Curator> = {
    exa: ExaCurator.get(),
    hnbest: HackerNewsCurator.get(),
  }

  // Queue functionality
  private readonly pending: News[] = []
  private running = 0
  private readonly concurrency = 1

  private constructor() {}

  public static get(): CuratorService {
    if (!CuratorService.instance) {
      CuratorService.instance = new CuratorService()
    }
    return CuratorService.instance
  }

  /** Add news to the curation queue */
  async enqueue(news: News): Promise<void> {
    this.pending.push(news)
    this.schedule()
  }

  /** Try to keep the curation pipeline full */
  private schedule(): void {
    while (this.running < this.concurrency && this.pending.length) {
      const news = this.pending.shift() as News
      this.running++
      void this.processNews(news)
    }
  }

  /** Process news item and forward URLs to reaper */
  private async processNews(news: News): Promise<void> {
    try {
      const urls = await this.run(news)
      await ReaperService.get().enqueue(urls, news.id)
    } catch (err) {
      console.error('CuratorService job failed', err)
    } finally {
      this.running--
      this.schedule()
    }
  }

  async run(news: NewsDto): Promise<string[]> {
    const curator = this.curators[news.strategy.provider]
    return curator.run(news)
  }
}
