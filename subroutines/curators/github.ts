import type { Alert } from '@everynews/schema'
import type { Curator, CuratorResult } from './type'

interface GitHubFeedLink {
  href: string
  type: string
}

interface GitHubFeedsResponse {
  timeline_url: string
  user_url: string
  current_user_public_url?: string
  current_user_url?: string
  current_user_actor_url?: string
  current_user_organization_url?: string
  current_user_organization_urls?: string[]
  security_advisories_url: string
  repository_discussions_url?: string
  repository_discussions_category_url?: string
  _links: {
    timeline: GitHubFeedLink
    user: GitHubFeedLink
    security_advisories: GitHubFeedLink
    current_user?: GitHubFeedLink
    current_user_public?: GitHubFeedLink
    current_user_actor?: GitHubFeedLink
    current_user_organization?: GitHubFeedLink
    current_user_organizations?: GitHubFeedLink[]
    repository_discussions?: GitHubFeedLink
    repository_discussions_category?: GitHubFeedLink
  }
}

export const GitHubCurator: Curator = async (
  alert: Alert,
): Promise<CuratorResult[]> => {
  if (alert.strategy.provider !== 'github') {
    throw new Error(
      `GitHubCurator got Alert Strategy ${alert.strategy.provider}`,
    )
  }

  const token = alert.strategy.token || process.env.GITHUB_TOKEN

  if (!token) {
    throw new Error('GitHubCurator requires a GitHub token')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    // First, get the available feeds
    const feedsResponse = await fetch('https://api.github.com/feeds', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    })

    if (!feedsResponse.ok) {
      throw new Error(
        `GitHub API error: ${feedsResponse.status} ${feedsResponse.statusText}`,
      )
    }

    const feeds: GitHubFeedsResponse = await feedsResponse.json()

    // For now, we'll fetch the timeline feed (public GitHub activity)
    // In the future, this could be configurable
    const timelineFeedUrl = feeds._links.timeline.href

    // Fetch the Atom feed
    const atomResponse = await fetch(timelineFeedUrl, {
      headers: {
        Accept: 'application/atom+xml',
      },
      signal: controller.signal,
    })

    if (!atomResponse.ok) {
      throw new Error(
        `GitHub feed error: ${atomResponse.status} ${atomResponse.statusText}`,
      )
    }

    const atomContent = await atomResponse.text()
    // Parse Atom feed to extract URLs
    // Look for link elements with rel="alternate" inside entry elements
    const urls: string[] = []

    // Split by entries first
    const entries = atomContent.match(/<entry>[\s\S]*?<\/entry>/g) || []

    for (const entry of entries) {
      // Extract the alternate link from each entry
      const linkMatch = entry.match(
        /<link[^>]+rel="alternate"[^>]+href="([^"]+)"/,
      )
      if (linkMatch?.[1]) {
        urls.push(linkMatch[1])
      }
    }

    // Limit to top 20 most recent entries
    return urls.slice(0, 20).map(url => ({ url, metadata: null }))
  } finally {
    clearTimeout(timeout)
  }
}
