import { track } from '@everynews/logs'
import type { Newsletter } from '@everynews/schema'
import { ExaCurator } from './curators/exa'
import { HnBestCurator } from './curators/hnbest'
import type { Curator } from './curators/type'

const curators = {
  exa: ExaCurator,
  hnbest: HnBestCurator,
}

export const curator = async (newsletter: Newsletter): Promise<string[]> => {
  try {
    await track({
      channel: 'curator',
      event: `Curating "${newsletter.name}"`,
      icon: '🎯',
      tags: {
        newsletter_id: newsletter.id,
        newsletter_name: newsletter.name,
        provider: newsletter.strategy.provider,
        type: 'info',
      },
    })

    const curator: Curator = curators[newsletter.strategy.provider]
    const urls = await curator(newsletter)

    await track({
      channel: 'curator',
      event: `Curated "${newsletter.name}", Found ${urls.length} URLs`,
      icon: '✅',
      tags: {
        newsletter_id: newsletter.id,
        newsletter_name: newsletter.name,
        provider: newsletter.strategy.provider,
        type: 'info',
        urls_found: urls.length,
      },
    })

    return urls
  } catch (error) {
    await track({
      channel: 'curator',
      event: `Curating "${newsletter.name}" Failed`,
      icon: '❌',
      tags: {
        error: String(error),
        newsletter_id: newsletter.id,
        newsletter_name: newsletter.name,
        provider: newsletter.strategy.provider,
        type: 'error',
      },
    })
    throw error
  }
}
