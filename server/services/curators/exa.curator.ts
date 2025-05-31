import type { NewsDto } from '@everynews/schema'
import Exa from 'exa-js'
import type { Curator } from './type'

export class ExaCurator implements Curator {
  private static instance: ExaCurator
  private exaClient: Exa

  private constructor() {
    this.exaClient = new Exa(process.env.EXA_API_KEY)
  }

  static get(): ExaCurator {
    if (!ExaCurator.instance) {
      ExaCurator.instance = new ExaCurator()
    }
    return ExaCurator.instance
  }

  async run(news: NewsDto): Promise<string[]> {
    if (news.strategy.provider !== 'exa') {
      throw new Error(`ExaCurator got News Strategy ${news.strategy.provider}`)
    }
    const { results } = await this.exaClient.searchAndContents(
      news.strategy.query,
    )
    return results.map((doc) => doc.url)
  }
}
