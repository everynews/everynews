import { track } from '@everynews/logs'
import type { Alert } from '@everynews/schema'
import { ExaCurator } from './curators/exa'
import { HnBestCurator } from './curators/hnbest'
import type { Curator } from './curators/type'

const curators = {
  exa: ExaCurator,
  hnbest: HnBestCurator,
}

export const curator = async (alert: Alert): Promise<string[]> => {
  try {
    await track({
      channel: 'curator',
      event: `Curating "${alert.name}"`,
      icon: '🎯',
      tags: {
        alert_id: alert.id,
        alert_name: alert.name,
        provider: alert.strategy.provider,
        type: 'info',
      },
    })

    const curator: Curator = curators[alert.strategy.provider]
    const urls = await curator(alert)

    await track({
      channel: 'curator',
      event: `Curated "${alert.name}", Found ${urls.length} URLs`,
      icon: '✅',
      tags: {
        alert_id: alert.id,
        alert_name: alert.name,
        provider: alert.strategy.provider,
        type: 'info',
        urls_found: urls.length,
      },
    })

    return urls
  } catch (error) {
    await track({
      channel: 'curator',
      event: `Curating "${alert.name}" Failed`,
      icon: '❌',
      tags: {
        alert_id: alert.id,
        alert_name: alert.name,
        error: String(error),
        provider: alert.strategy.provider,
        type: 'error',
      },
    })
    throw error
  }
}
