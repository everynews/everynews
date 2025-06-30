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
  await track({
    channel: 'slack',
    description: `Getting valid Slack token for channel ${channelId}`,
    event: 'Token Retrieval Starting',
    icon: '🔑',
    tags: {
      channel_id: channelId,
      type: 'info',
    },
  })

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
      await track({
        channel: 'slack',
        description: `Channel ${channelId} not found in database`,
        event: 'Channel Not Found',
        icon: '❌',
        tags: {
          channel_id: channelId,
          type: 'error',
        },
      })
      throw new Error('Channel not found')
    }

    const config = channel.config as SlackChannelConfig

    await track({
      channel: 'slack',
      description: `Retrieved Slack config for channel ${channelId}`,
      event: 'Config Retrieved',
      icon: '📋',
      tags: {
        channel_id: channelId,
        expires_at: config.expiresAt?.toISOString() || 'never',
        has_access_token: !!config.accessToken,
        has_refresh_token: !!config.refreshToken,
        token_rotation_enabled: config.tokenRotationEnabled || false,
        type: 'info',
      },
    })

    const token = await decrypt(config.accessToken)

    await track({
      channel: 'slack',
      description: `Successfully decrypted access token for channel ${channelId}`,
      event: 'Token Decrypted',
      icon: '✅',
      tags: {
        channel_id: channelId,
        token_length: token.length,
        type: 'info',
      },
    })

    return token
  } catch (error) {
    await track({
      channel: 'slack',
      description: `Failed to get valid token for channel ${channelId}: ${error}`,
      event: 'Token Retrieval Failed',
      icon: '❌',
      tags: {
        channel_id: channelId,
        error: String(error),
        error_message: error instanceof Error ? error.message : String(error),
        type: 'error',
      },
    })
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
