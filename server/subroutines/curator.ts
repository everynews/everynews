import type { NewsDto } from '@everynews/schema'
import PQueue from 'p-queue'
import { ExaCurator } from './curators/exa'
import { HnBestCurator } from './curators/hnbest'
import type { Curator } from './curators/type'

const curators = {
  exa: ExaCurator,
  hnbest: HnBestCurator,
}

export const curator = async (news: NewsDto): Promise<string[]> => {
  const curator: Curator = curators[news.strategy.provider]
  return await curator(news)
}
