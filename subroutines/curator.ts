import { track } from '@everynews/logs'
import type { Alert } from '@everynews/schema'
import { GitHubCurator } from './curators/github'
import { GoogleCurator } from './curators/google'
import { HnTopCurator } from './curators/hntop'
import { ProductHuntCurator } from './curators/producthunt'
import { WhoisCurator } from './curators/whois'

const curators = {
  github: GitHubCurator,
  google: GoogleCurator,
  hntop: HnTopCurator,
  producthunt: ProductHuntCurator,
  whois: WhoisCurator,
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

    const urls = await curators[alert.strategy.provider](alert)

    // Deduplicate URLs to prevent processing the same URL multiple times
    const uniqueUrls = [...new Set(urls)]
    const duplicatesRemoved = urls.length - uniqueUrls.length

    await track({
      channel: 'curator',
      event: `Curated "${alert.name}", Found ${uniqueUrls.length} unique URLs${duplicatesRemoved > 0 ? ` (${duplicatesRemoved} duplicates removed)` : ''}`,
      icon: '✅',
      tags: {
        alert_id: alert.id,
        alert_name: alert.name,
        duplicates_removed: duplicatesRemoved,
        provider: alert.strategy.provider,
        type: 'info',
        unique_urls: uniqueUrls.length,
        urls_found: urls.length,
      },
    })

    return uniqueUrls
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
