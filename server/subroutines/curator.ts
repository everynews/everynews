import type { News } from '@everynews/schema'
import { trackEvent } from '@everynews/server/lib/logsnag'
import { ExaCurator } from './curators/exa'
import { HnBestCurator } from './curators/hnbest'
import type { Curator } from './curators/type'

const curators = {
  exa: ExaCurator,
  hnbest: HnBestCurator,
}

export const curator = async (news: News): Promise<string[]> => {
  try {
    await trackEvent({
      channel: 'curator',
      description: `Starting curation with ${news.strategy.provider} for: ${news.name}`,
      event: 'Curation Started',
      icon: '🎯',
      tags: {
        news_id: news.id,
        news_name: news.name,
        provider: news.strategy.provider,
      },
    })

    const curator: Curator = curators[news.strategy.provider]
    const urls = await curator(news)

    await trackEvent({
      channel: 'curator',
      description: `Found ${urls.length} URLs for: ${news.name}`,
      event: 'Curation Completed',
      icon: '✅',
      tags: {
        news_id: news.id,
        news_name: news.name,
        provider: news.strategy.provider,
        urls_found: urls.length,
      },
    })

    return urls
  } catch (error) {
    await trackEvent({
      channel: 'curator',
      description: `Curation failed for: ${news.name} - ${String(error)}`,
      event: 'Curation Failed',
      icon: '❌',
      tags: {
        error: String(error),
        news_id: news.id,
        news_name: news.name,
        provider: news.strategy.provider,
      },
    })
    throw error
  }
}
