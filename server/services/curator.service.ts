import type { NewsDto } from '@everynews/schema'
import { ExaCurator } from './curators/exa.curator'
import { HackerNewsCurator } from './curators/hnbest.curator'
import type { Curator } from './curators/type'

export class CuratorService {
  private static instance: CuratorService
  private curators: Record<string, Curator> = {
    exa: ExaCurator.get(),
    hnbest: HackerNewsCurator.get(),
  }
  private constructor() {}

  public static get(): CuratorService {
    if (!CuratorService.instance) {
      CuratorService.instance = new CuratorService()
    }
    return CuratorService.instance
  }

  async run(news: NewsDto): Promise<string[]> {
    const curator = this.curators[news.strategy.provider]
    return curator.run(news)
  }
}
