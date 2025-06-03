import type { NewsDto } from '@everynews/schema'
import Exa from 'exa-js'
import type { Curator } from './type'

if (!process.env.EXASEARCH_API_KEY) {
  throw new Error('EXASEARCH_API_KEY is not set')
}

const exa = new Exa(process.env.EXASEARCH_API_KEY)

export const ExaCurator: Curator = async (news: NewsDto): Promise<string[]> => {
  if (news.strategy.provider !== 'exa') {
    throw new Error(`ExaCurator got News Strategy ${news.strategy.provider}`)
  }

  const { results } = await exa.searchAndContents(news.strategy.query)

  return results.map((doc) => doc.url)
}
