import { db } from '@everynews/database'
import { decrypt, encrypt } from '@everynews/lib/crypto'
import { track } from '@everynews/logs'
import {
  channels,
  type SlackChannelConfig,
  SlackChannelConfigSchema,
} from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { refreshAccessToken } from './oauth-installer'

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

    const config = SlackChannelConfigSchema.parse(channel.config)

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
    const decryptedRefreshToken = await decrypt(config.refreshToken)

    // Use the OAuth installer to refresh the token
    const refreshResult = await refreshAccessToken(
      decryptedRefreshToken,
      config.teamId,
    )

    // Update the channel with new tokens
    const newConfig: SlackChannelConfig = {
      ...config,
      accessToken: await encrypt(refreshResult.accessToken),
      expiresAt:
        refreshResult.expiresAt || new Date(Date.now() + 12 * 60 * 60 * 1000),
      refreshToken: refreshResult.refreshToken
        ? await encrypt(refreshResult.refreshToken)
        : config.refreshToken,
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
    try {
      await refreshSlackToken(channelId)
    } catch (refreshError) {
      // Log the refresh error but continue to try getting the existing token
      await track({
        channel: 'slack',
        description: `Token refresh failed for channel ${channelId}, will try existing token`,
        event: 'Token Refresh Error',
        icon: '⚠️',
        tags: {
          channel_id: channelId,
          error: String(refreshError),
          error_message:
            refreshError instanceof Error
              ? refreshError.message
              : String(refreshError),
          type: 'warning',
        },
      })

      // If it's an invalid_refresh_token error, we should inform the user
      if (
        refreshError instanceof Error &&
        refreshError.message.includes('invalid_refresh_token')
      ) {
        throw new Error(
          'Your Slack authentication has expired. Please reconnect your Slack workspace.',
        )
      }
    }

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

    const config = SlackChannelConfigSchema.parse(channel.config)

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

export function isTokenError(error: unknown): boolean {
  const err = error as { data?: { error?: string }; code?: string }
  const errorCode = err?.data?.error || err?.code || ''
  return [
    'invalid_auth',
    'token_revoked',
    'token_expired',
    'invalid_refresh_token',
    'missing_scope',
  ].includes(errorCode)
}
