import type { Alert } from '@everynews/schema'
import Exa from 'exa-js'
import type { Curator } from './type'

if (!process.env.EXASEARCH_API_KEY) {
  throw new Error('EXASEARCH_API_KEY is not set')
}

const exa = new Exa(process.env.EXASEARCH_API_KEY)

export const ExaCurator: Curator = async (alert: Alert): Promise<string[]> => {
  if (alert.strategy.provider !== 'exa') {
    throw new Error(`ExaCurator got Alert Strategy ${alert.strategy.provider}`)
  }

  if (!alert.strategy.query) {
    throw new Error('ExaCurator got Alert Strategy with no query')
  }

  const { results } = await exa.searchAndContents(alert.strategy.query)

  return results.map((doc) => doc.url)
}
