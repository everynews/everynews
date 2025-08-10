import { track } from '@everynews/logs'
import type { Alert } from '@everynews/schema'
import { GitHubCurator } from './curators/github'
import { GoogleCurator } from './curators/google'
import { HnTopCurator } from './curators/hntop'
import { ProductHuntCurator } from './curators/producthunt'
import type { CuratorResult } from './curators/type'
import { WhoisCurator } from './curators/whois'

const curators = {
  github: GitHubCurator,
  google: GoogleCurator,
  hntop: HnTopCurator,
  producthunt: ProductHuntCurator,
  whois: WhoisCurator,
}

export const curator = async (alert: Alert): Promise<CuratorResult[]> => {
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

    const results = await curators[alert.strategy.provider](alert)

    // Deduplicate by URL to prevent processing the same URL multiple times
    const uniqueResults: CuratorResult[] = []
    const seenUrls = new Set<string>()

    for (const result of results) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url)
        uniqueResults.push(result)
      }
    }

    const duplicatesRemoved = results.length - uniqueResults.length

    await track({
      channel: 'curator',
      event: `Curated "${alert.name}", Found ${uniqueResults.length} unique URLs${duplicatesRemoved > 0 ? ` (${duplicatesRemoved} duplicates removed)` : ''}`,
      icon: '✅',
      tags: {
        alert_id: alert.id,
        alert_name: alert.name,
        duplicates_removed: duplicatesRemoved,
        provider: alert.strategy.provider,
        type: 'info',
        unique_urls: uniqueResults.length,
        urls_found: results.length,
      },
    })

    return uniqueResults
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
