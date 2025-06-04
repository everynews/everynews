import type { Newsletter } from '@everynews/schema'
import Exa from 'exa-js'
import type { Curator } from './type'

if (!process.env.EXASEARCH_API_KEY) {
  throw new Error('EXASEARCH_API_KEY is not set')
}

const exa = new Exa(process.env.EXASEARCH_API_KEY)

export const ExaCurator: Curator = async (
  newsletter: Newsletter,
): Promise<string[]> => {
  if (newsletter.strategy.provider !== 'exa') {
    throw new Error(
      `ExaCurator got Newsletter Strategy ${newsletter.strategy.provider}`,
    )
  }

  const { results } = await exa.searchAndContents(newsletter.strategy.query)

  return results.map((doc) => doc.url)
}
