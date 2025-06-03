import type { NewsDto } from '@everynews/schema'
import Exa from 'exa-js'
import type { Curator } from './type'

const exa = new Exa(process.env.EXA_API_KEY)

export const ExaCurator: Curator = async (news: NewsDto): Promise<string[]> => {
  if (news.strategy.provider !== 'exa') {
    throw new Error(`ExaCurator got News Strategy ${news.strategy.provider}`)
  }

  const { results } = await exa.searchAndContents(news.strategy.query)

  return results.map((doc) => doc.url)
}
