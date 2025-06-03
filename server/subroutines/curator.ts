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
      event: 'Curation Started',
      description: `Starting curation with ${news.strategy.provider} for: ${news.name}`,
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
      event: 'Curation Completed',
      description: `Found ${urls.length} URLs for: ${news.name}`,
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
      event: 'Curation Failed',
      description: `Curation failed for: ${news.name} - ${String(error)}`,
      icon: '❌',
      tags: {
        news_id: news.id,
        news_name: news.name,
        provider: news.strategy.provider,
        error: String(error),
      },
    })
    throw error
  }
}
