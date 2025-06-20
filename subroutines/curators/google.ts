import type { Alert } from '@everynews/schema'
import type { Curator } from './type'

export const GoogleCurator: Curator = async (
  alert: Alert,
): Promise<string[]> => {
  if (alert.strategy.provider !== 'google') {
    throw new Error(
      `GoogleCurator got Alert Strategy ${alert.strategy.provider}`,
    )
  }

  if (!alert.strategy.query) {
    throw new Error('GoogleCurator got Alert Strategy with no query')
  }

  if (!process.env.BRIGHTDATA_API_KEY) {
    throw new Error('BRIGHTDATA_API_KEY is not set')
  }

  const response = await fetch('https://api.brightdata.com/request', {
    body: JSON.stringify({
      format: 'raw',
      url: `https://www.google.com/search?q=${encodeURIComponent(alert.strategy.query)}&tbm=nws&tbs=qdr:m`,
      zone: 'everynews_serp',
    }),
    headers: {
      Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(
      `BrightData API error: ${response.status} ${response.statusText} ${await response.text()}`,
    )
  }

  const html = await response.text()

  // Extract URLs from Google search results
  const urlRegex = /<a[^>]+href="(https?:\/\/[^"]+)"/g
  const urls: string[] = []
  let match = urlRegex.exec(html)

  while (match !== null) {
    const url = match[1]
    // Filter out Google's own URLs and tracking URLs
    if (!url.includes('google.com') && !url.includes('googleusercontent.com')) {
      urls.push(url)
    }
    match = urlRegex.exec(html)
  }

  // Return unique URLs
  return [...new Set(urls)]
}
