import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { channels, type SlackChannelConfig } from '@everynews/schema'
import { refreshSlackToken } from '@everynews/server/slack/token-refresh'
import { and, eq, isNull } from 'drizzle-orm'

export const refreshExpiredSlackTokens = async () => {
  try {
    await track({
      channel: 'slack',
      description: 'Starting Slack token refresh job',
      event: 'Token Refresh Job Started',
      icon: '🔄',
      tags: {
        type: 'info',
      },
    })

    // Find all Slack channels with token rotation enabled
    const slackChannels = await db.query.channels.findMany({
      where: and(eq(channels.type, 'slack'), isNull(channels.deletedAt)),
    })

    let refreshed = 0
    let failed = 0

    for (const channel of slackChannels) {
      const config = channel.config as SlackChannelConfig

      // Skip if token rotation is not enabled
      if (!config.tokenRotationEnabled || !config.refreshToken) {
        continue
      }

      try {
        // Check if token will expire in the next 2 hours
        if (config.expiresAt) {
          const expiryTime = new Date(config.expiresAt).getTime()
          const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000

          if (expiryTime > twoHoursFromNow) {
            // Token is still valid for more than 2 hours
            continue
          }
        }

        // Refresh the token
        const success = await refreshSlackToken(channel.id)

        if (success) {
          refreshed++
        }
      } catch (error) {
        failed++
        await track({
          channel: 'slack',
          description: `Failed to refresh token for channel ${channel.id}`,
          event: 'Token Refresh Failed',
          icon: '❌',
          tags: {
            channel_id: channel.id,
            error: String(error),
            type: 'error',
          },
        })
      }
    }

    await track({
      channel: 'slack',
      description: `Completed Slack token refresh job: ${refreshed} refreshed, ${failed} failed`,
      event: 'Token Refresh Job Completed',
      icon: '✅',
      tags: {
        failed,
        refreshed,
        total: slackChannels.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'slack',
      description: 'Failed to run Slack token refresh job',
      event: 'Token Refresh Job Failed',
      icon: '💥',
      tags: {
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}
