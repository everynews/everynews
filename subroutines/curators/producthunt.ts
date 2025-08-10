import { ProductHuntClient } from '@everynews/lib/producthunt'
import type { Alert } from '@everynews/schema'
import type { Curator, CuratorResult } from './type'

export const ProductHuntCurator: Curator = async (
  alert: Alert,
): Promise<CuratorResult[]> => {
  if (alert.strategy.provider !== 'producthunt') {
    throw new Error(
      `ProductHuntCurator got Alert Strategy ${alert.strategy.provider}`,
    )
  }

  const { token, limit } = alert.strategy

  if (!token) {
    throw new Error('ProductHuntCurator got Alert Strategy with no token')
  }

  const client = new ProductHuntClient(token)
  const launches = await client.getTodaysTopLaunches(limit)

  // Return the Product Hunt URLs for each launch with no metadata
  return launches.map((launch) => ({ url: launch.url, metadata: null }))
}
