import { ProductHuntClient } from '@everynews/lib/producthunt'
import type { Alert } from '@everynews/schema'
import type { Curator } from './type'

export const ProductHuntCurator: Curator = async (
  alert: Alert,
): Promise<string[]> => {
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

  // Return the Product Hunt URLs for each launch
  return launches.map((launch) => launch.url)
}
