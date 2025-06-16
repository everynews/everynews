import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { sendChannelVerification } from '@everynews/messengers'
import { channels, channelVerifications } from '@everynews/schema'
import { ChannelDtoSchema, ChannelSchema } from '@everynews/schema/channel'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { z } from 'zod'
import type { WithAuth } from '../bindings/auth'

export const ChannelRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/',
    describeRoute({
      description: 'Get All Channels',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema.array()),
            },
          },
          description: 'Get All Channels',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'channels',
          description: 'User tried to access channels without authentication',
          event: 'Unauthorized Access',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db
        .select()
        .from(channels)
        .where(and(eq(channels.userId, user.id), isNull(channels.deletedAt)))

      await track({
        channel: 'channels',
        description: `Retrieved ${result.length} channels for user`,
        event: 'Channels Retrieved',
        icon: '📋',
        tags: {
          count: result.length,
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Create Channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Create Channel',
        },
      },
    }),
    validator('json', ChannelDtoSchema),
    async (c) => {
      const { name, type, config } = await c.req.json()
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'channels',
          description: 'User tried to create channel without authentication',
          event: 'Unauthorized Channel Creation',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Check if the destination email is the same as the user's sign-in email
      if (config.destination === user.email) {
        await track({
          channel: 'channels',
          description: 'User tried to create channel with sign-in email',
          event: 'Duplicate Sign-in Email',
          icon: '⚠️',
          tags: {
            type: 'warning',
          },
          user_id: user.id,
        })
        return c.json(
          {
            error:
              'Cannot use your sign-in email as a channel. Your sign-in email is already your default channel.',
          },
          400,
        )
      }

      const inserted = await db
        .insert(channels)
        .values({
          config,
          name,
          type,
          userId: user.id,
        })
        .returning()

      await track({
        channel: 'channels',
        description: `Created new ${type} channel: ${name}`,
        event: 'Channel Created',
        icon: '✅',
        tags: {
          channel_name: name,
          channel_type: type,
        },
        user_id: user.id,
      })

      return c.json(inserted)
    },
  )
  .put(
    '/:id',
    describeRoute({
      description: 'Update Channel by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Update Channel by ID',
        },
      },
    }),
    validator('json', ChannelDtoSchema),
    async (c) => {
      const { id } = c.req.param()
      const request = await c.req.json()
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'channels',
          description: 'User tried to update channel without authentication',
          event: 'Unauthorized Channel Update',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Get the existing channel to compare email addresses
      const existingChannel = await db.query.channels.findFirst({
        where: and(
          eq(channels.id, id),
          eq(channels.userId, user.id),
          isNull(channels.deletedAt),
        ),
      })

      if (!existingChannel) {
        return c.json({ error: 'Channel not found' }, 404)
      }

      // Check if the destination email is the same as the user's sign-in email
      if (request.config.destination === user.email) {
        await track({
          channel: 'channels',
          description: 'User tried to update channel with sign-in email',
          event: 'Duplicate Sign-in Email',
          icon: '⚠️',
          tags: {
            channel_id: id,
            type: 'warning',
          },
          user_id: user.id,
        })
        return c.json(
          {
            error:
              'Cannot use your sign-in email as a channel. Your sign-in email is already your default channel.',
          },
          400,
        )
      }

      // Check if email address has changed
      const emailChanged =
        ChannelSchema.parse(existingChannel).config.destination !==
        ChannelDtoSchema.parse(request).config.destination

      // If email changed and channel was verified, mark as unverified
      const updateData = {
        ...request,
        updatedAt: new Date(),
        ...(emailChanged && existingChannel.verified
          ? {
              verified: false,
              verifiedAt: null,
            }
          : {}),
      }

      const result = await db
        .update(channels)
        .set(updateData)
        .where(
          and(
            eq(channels.id, id),
            eq(channels.userId, user.id),
            isNull(channels.deletedAt),
          ),
        )
        .returning()

      await track({
        channel: 'channels',
        description:
          emailChanged && existingChannel.verified
            ? `Updated channel: ${id} (email changed, marked as unverified)`
            : `Updated channel: ${id}`,
        event: 'Channel Updated',
        icon: '✏️',
        tags: {
          channel_id: id,
          email_changed: String(emailChanged),
          fields_updated: Object.keys(request).join(', '),
          verification_reset: String(emailChanged && existingChannel.verified),
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
  .delete(
    '/:id',
    describeRoute({
      description: 'Delete Channel by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Delete Channel by ID',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'channels',
          description: 'User tried to delete channel without authentication',
          event: 'Unauthorized Channel Deletion',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Soft delete by setting deletedAt
      const result = await db
        .update(channels)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(channels.id, id),
            eq(channels.userId, user.id),
            isNull(channels.deletedAt),
          ),
        )
        .returning()

      await track({
        channel: 'channels',
        description: `Deleted channel: ${id}`,
        event: 'Channel Deleted',
        icon: '🗑️',
        tags: {
          channel_id: id,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
  .post(
    '/:id/send-verification',
    describeRoute({
      description: 'Send verification email for channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
          description: 'Verification email sent',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()
      const user = c.get('user')
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Get the channel and verify ownership
      const channel = ChannelSchema.parse(
        await db.query.channels.findFirst({
          where: and(
            eq(channels.id, id),
            eq(channels.userId, user.id),
            isNull(channels.deletedAt),
          ),
        }),
      )

      if (!channel) {
        return c.json({ error: 'Channel not found' }, 404)
      }

      if (channel.verified) {
        return c.json({ error: 'Channel already verified' }, 400)
      }

      const recentVerification = await db.query.channelVerifications.findFirst({
        where: and(
          eq(channelVerifications.channelId, id),
          gt(channelVerifications.createdAt, new Date(Date.now() - 60 * 1000)), // 1 minute
        ),
      })

      if (recentVerification) {
        return c.json(
          {
            error: 'Please Request Verification After 1 min',
          },
          429,
        )
      }

      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      await db.insert(channelVerifications).values({
        channelId: id,
        expiresAt,
        token,
      })

      const verificationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/verify/channel/${token}`

      await sendChannelVerification({
        channelName: channel.name,
        email: channel.config.destination,
        verificationLink,
      })

      await track({
        channel: 'channels',
        description: `Sent verification email for channel: ${channel.name}`,
        event: 'Channel Verification Email Sent',
        icon: '📧',
        tags: {
          channel_id: id,
          channel_name: channel.name,
        },
        user_id: user.id,
      })

      return c.json({ success: true })
    },
  )
  .get(
    '/verify/:token',
    describeRoute({
      description: 'Verify channel with token',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(
                z.object({ channelName: z.string(), success: z.boolean() }),
              ),
            },
          },
          description: 'Channel verified successfully',
        },
      },
    }),
    async (c) => {
      const { token } = c.req.param()

      // Find valid verification token
      const verification = await db.query.channelVerifications.findFirst({
        where: and(
          eq(channelVerifications.token, token),
          eq(channelVerifications.used, false),
          gt(channelVerifications.expiresAt, new Date()),
        ),
      })

      if (!verification) {
        return c.json({ error: 'Invalid or Expired Verification Token' }, 400)
      }

      // Get the channel
      const channel = ChannelSchema.parse(
        await db.query.channels.findFirst({
          where: and(
            eq(channels.id, verification.channelId),
            isNull(channels.deletedAt),
          ),
        }),
      )

      if (!channel) {
        return c.json({ error: 'Channel Not Found' }, 404)
      }

      if (channel.verified) {
        return c.json({ error: 'Channel Already Verified' }, 400)
      }

      // Update channel as verified
      await db
        .update(channels)
        .set({
          verified: true,
          verifiedAt: new Date(),
        })
        .where(eq(channels.id, verification.channelId))

      // Mark verification as used
      await db
        .update(channelVerifications)
        .set({ used: true })
        .where(eq(channelVerifications.id, verification.id))

      await track({
        channel: 'channels',
        description: `Channel verified: ${channel.name}`,
        event: 'Channel Verified',
        icon: '✅',
        tags: {
          channel_id: channel.id,
          channel_name: channel.name,
        },
        user_id: channel.userId,
      })

      return c.json({ channelName: channel.name, success: true })
    },
  )
