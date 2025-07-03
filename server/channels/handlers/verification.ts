import { db } from '@everynews/database'
import { decrypt } from '@everynews/lib/crypto'
import { url } from '@everynews/lib/url'
import { track } from '@everynews/logs'
import {
  sendChannelVerification,
  sendDiscordVerification,
  sendSlackVerification,
} from '@everynews/messengers'
import {
  checkPhoneVerification,
  sendPhoneVerification,
} from '@everynews/messengers/surge'
import { channels, channelVerifications } from '@everynews/schema'
import {
  DiscordChannelConfigSchema,
  EmailChannelConfigSchema,
  PhoneChannelConfigSchema,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
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
    if (channel.type === 'phone') {
      const config = PhoneChannelConfigSchema.parse(channel.config)
      await sendPhoneVerification({
        phoneNumber: config.destination,
      })
    } else if (channel.type === 'slack') {
      const config = SlackChannelConfigSchema.parse(channel.config)
      const decryptedToken = await decrypt(config.accessToken)
      await sendSlackVerification({
        accessToken: decryptedToken,
        channelId: config.channel?.id ?? '',
        channelName: config.channel?.name ?? '',
      })
    } else if (channel.type === 'discord') {
      const config = DiscordChannelConfigSchema.parse(channel.config)
      await sendDiscordVerification({
        botToken: config.botToken,
        channelId: config.channel?.id ?? '',
        channelName: config.channel?.name ?? '',
      })
    } else {
      const config = EmailChannelConfigSchema.parse(channel.config)
      await sendChannelVerification({
        channelName: channel.name,
        email: config.destination,
        verificationLink: `${url}/verify/channel`,
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

    if (channel.type === 'phone') {
      isValid = await checkPhoneVerification({
        code,
        verificationId: channel.id,
      })
    } else {
      const [verification] = await db
        .select()
        .from(channelVerifications)
        .where(
          and(
            eq(channelVerifications.channelId, id),
            eq(channelVerifications.token, code),
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
