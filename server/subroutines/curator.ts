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
  const queue = new PQueue({ concurrency: 3 })
  const curator: Curator = curators[news.strategy.provider]
  const urls = await queue.add(() => curator(news))
  return urls || []
}
