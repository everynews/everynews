import { track } from '@everynews/logs'
import type { News } from '@everynews/schema'
import { ExaCurator } from './curators/exa'
import { HnBestCurator } from './curators/hnbest'
import type { Curator } from './curators/type'

const curators = {
  exa: ExaCurator,
  hnbest: HnBestCurator,
}

export const curator = async (news: News): Promise<string[]> => {
  try {
    await track({
      channel: 'curator',
      event: `Curating "${news.name}"`,
      icon: '🎯',
      tags: {
        news_id: news.id,
        news_name: news.name,
        provider: news.strategy.provider,
        type: 'info',
      },
    })

    const curator: Curator = curators[news.strategy.provider]
    const urls = await curator(news)

    await track({
      channel: 'curator',
      event: `Curated "${news.name}", Found ${urls.length} URLs`,
      icon: '✅',
      tags: {
        news_id: news.id,
        news_name: news.name,
        provider: news.strategy.provider,
        type: 'info',
        urls_found: urls.length,
      },
    })

    return urls
  } catch (error) {
    await track({
      channel: 'curator',
      event: `Curating "${news.name}" Failed`,
      icon: '❌',
      tags: {
        error: String(error),
        news_id: news.id,
        news_name: news.name,
        provider: news.strategy.provider,
        type: 'error',
      },
    })
    throw error
  }
}
