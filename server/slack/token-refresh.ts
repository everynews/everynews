import { db } from '@everynews/database'
import { decrypt, encrypt } from '@everynews/lib/crypto'
import { track } from '@everynews/logs'
import { channels, type SlackChannelConfig } from '@everynews/schema'
import { WebClient } from '@slack/web-api'
import { and, eq, isNull } from 'drizzle-orm'

export async function refreshSlackToken(channelId: string): Promise<boolean> {
  try {
    // Get the channel
    const channel = await db.query.channels.findFirst({
      where: and(
        eq(channels.id, channelId),
        eq(channels.type, 'slack'),
        isNull(channels.deletedAt),
      ),
    })

    if (!channel) {
      throw new Error('Channel not found')
    }

    const config = channel.config as SlackChannelConfig

    // Check if token rotation is enabled
    if (!config.tokenRotationEnabled || !config.refreshToken) {
      await track({
        channel: 'slack',
        description: 'Token rotation not enabled for channel',
        event: 'Token Refresh Skipped',
        icon: '⏭️',
        tags: {
          channel_id: channelId,
          type: 'info',
        },
      })
      return false
    }

    // Check if token needs refresh (refresh 1 hour before expiry)
    if (config.expiresAt) {
      const expiryTime = new Date(config.expiresAt).getTime()
      const now = Date.now()
      const oneHourInMs = 60 * 60 * 1000

      if (expiryTime - now > oneHourInMs) {
        // Token still valid for more than an hour
        return false
      }
    }

    // Decrypt the refresh token
    const refreshToken = await decrypt(config.refreshToken)

    // Use the Slack Web API to refresh the token
    const slack = new WebClient()

    const result = await slack.tooling.tokens.rotate({
      refresh_token: refreshToken,
    })

    if (!result.ok || !result.token || !result.refresh_token) {
      throw new Error('Failed to refresh token')
    }

    // Update the channel with new tokens
    const newConfig: SlackChannelConfig = {
      ...config,
      accessToken: await encrypt(result.token),
      expiresAt: result.exp
        ? new Date(Date.now() + result.exp * 1000)
        : new Date(Date.now() + 12 * 60 * 60 * 1000),
      refreshToken: await encrypt(result.refresh_token),
    }

    await db
      .update(channels)
      .set({
        config: newConfig,
        updatedAt: new Date(),
      })
      .where(eq(channels.id, channelId))

    await track({
      channel: 'slack',
      description: 'Successfully refreshed Slack token',
      event: 'Token Refreshed',
      icon: '🔄',
      tags: {
        channel_id: channelId,
        expires_at: newConfig.expiresAt?.toISOString() || '',
        type: 'info',
      },
    })

    return true
  } catch (error) {
    await track({
      channel: 'slack',
      description: 'Failed to refresh Slack token',
      event: 'Token Refresh Failed',
      icon: '❌',
      tags: {
        channel_id: channelId,
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}

export async function getValidSlackToken(channelId: string): Promise<string> {
  try {
    // First try to refresh the token if needed
    await refreshSlackToken(channelId)

    // Get the channel with potentially updated token
    const channel = await db.query.channels.findFirst({
      where: and(
        eq(channels.id, channelId),
        eq(channels.type, 'slack'),
        isNull(channels.deletedAt),
      ),
    })

    if (!channel) {
      throw new Error('Channel not found')
    }

    const config = channel.config as SlackChannelConfig
    return await decrypt(config.accessToken)
  } catch (error) {
    throw new Error(`Failed to get valid token: ${error}`)
  }
}

// Helper to check if a Slack API error is due to invalid token
export function isTokenError(error: unknown): boolean {
  const err = error as { data?: { error?: string }; code?: string }
  const errorCode = err?.data?.error || err?.code
  return (
    errorCode === 'invalid_auth' ||
    errorCode === 'token_revoked' ||
    errorCode === 'token_expired' ||
    errorCode === 'invalid_refresh_token'
  )
}
