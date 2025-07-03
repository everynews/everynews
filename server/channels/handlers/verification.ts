import { db } from '@everynews/database'
import { decrypt } from '@everynews/lib/crypto'
import { url } from '@everynews/lib/url'
import { track } from '@everynews/logs'
import {
  checkSurgeVerification,
  sendChannelVerification,
  sendDiscordVerification,
  sendSlackVerification,
  sendSurgeVerification,
} from '@everynews/messengers'
import { channels, channelVerifications } from '@everynews/schema'
import type { DiscordChannelConfig } from '@everynews/schema/channel'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { and, eq, gt, isNull } from 'drizzle-orm'
import type { Context } from 'hono'

export const sendVerification = async (c: Context<WithAuth>) => {
  const { id } = c.req.param()
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [channel] = await db
    .select()
    .from(channels)
    .where(
      and(
        eq(channels.id, id),
        eq(channels.userId, user.id),
        isNull(channels.deletedAt),
      ),
    )

  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404)
  }

  if (channel.verified) {
    return c.json({ error: 'Channel already verified' }, 400)
  }

  // Check for recent verification attempts
  const recentVerifications = await db
    .select()
    .from(channelVerifications)
    .where(
      and(
        eq(channelVerifications.channelId, id),
        gt(
          channelVerifications.createdAt,
          new Date(Date.now() - 5 * 60 * 1000),
        ),
      ),
    )

  if (recentVerifications.length > 0) {
    return c.json(
      { error: 'Please wait 5 minutes before requesting another code' },
      429,
    )
  }

  try {
    if (channel.type === 'surge') {
      await sendSurgeVerification({
        channelId: channel.id,
        config: channel.config as { surgeAlertId: string },
      })
    } else if (channel.type === 'slack') {
      const config = SlackChannelConfigSchema.parse(channel.config)
      const decryptedToken = decrypt(config.token)
      await sendSlackVerification({
        channelConfig: { ...config, token: decryptedToken },
        channelId: channel.id,
      })
    } else if (channel.type === 'discord') {
      const config = channel.config as DiscordChannelConfig
      await sendDiscordVerification({
        channelConfig: config,
        channelId: channel.id,
      })
    } else {
      await sendChannelVerification({
        channel,
        url: url('verify/channel'),
      })
    }

    await track({
      channel: 'channels',
      description: `Sent ${channel.type} verification to channel: ${id}`,
      event: 'Verification Sent',
      icon: '📤',
      tags: {
        channel_id: id,
        channel_type: channel.type,
      },
      user_id: user.id,
    })

    return c.json({ success: true })
  } catch (error) {
    await track({
      channel: 'channels',
      description: `Failed to send verification to channel: ${id}`,
      event: 'Verification Failed',
      icon: '❌',
      tags: {
        channel_id: id,
        channel_type: channel.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      },
      user_id: user.id,
    })
    return c.json({ error: 'Failed to send verification' }, 500)
  }
}

export const checkVerification = async (c: Context<WithAuth>) => {
  const { id } = c.req.param()
  const { code } = await c.req.json<{ code: string }>()
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [channel] = await db
    .select()
    .from(channels)
    .where(
      and(
        eq(channels.id, id),
        eq(channels.userId, user.id),
        isNull(channels.deletedAt),
      ),
    )

  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404)
  }

  if (channel.verified) {
    return c.json({ error: 'Channel already verified' }, 400)
  }

  try {
    let isValid = false

    if (channel.type === 'surge') {
      isValid = await checkSurgeVerification({
        channelId: channel.id,
        code,
        config: channel.config as { surgeAlertId: string },
      })
    } else {
      // Check verification code in database
      const [verification] = await db
        .select()
        .from(channelVerifications)
        .where(
          and(
            eq(channelVerifications.channelId, id),
            eq(channelVerifications.code, code),
            gt(channelVerifications.expiresAt, new Date()),
          ),
        )

      isValid = !!verification
    }

    if (isValid) {
      await db
        .update(channels)
        .set({
          verified: true,
          verifiedAt: new Date(),
        })
        .where(eq(channels.id, id))

      await track({
        channel: 'channels',
        description: `Verified ${channel.type} channel: ${id}`,
        event: 'Channel Verified',
        icon: '✅',
        tags: {
          channel_id: id,
          channel_type: channel.type,
        },
        user_id: user.id,
      })

      return c.json({ success: true })
    }

    await track({
      channel: 'channels',
      description: `Invalid verification code for channel: ${id}`,
      event: 'Verification Failed',
      icon: '❌',
      tags: {
        channel_id: id,
        channel_type: channel.type,
        type: 'error',
      },
      user_id: user.id,
    })

    return c.json({ error: 'Invalid or expired code' }, 400)
  } catch (error) {
    await track({
      channel: 'channels',
      description: `Error verifying channel: ${id}`,
      event: 'Verification Error',
      icon: '🚨',
      tags: {
        channel_id: id,
        channel_type: channel.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      },
      user_id: user.id,
    })
    return c.json({ error: 'Failed to verify channel' }, 500)
  }
}
