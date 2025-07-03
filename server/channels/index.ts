import { db } from '@everynews/database'
import { decrypt } from '@everynews/lib/crypto'
import { url } from '@everynews/lib/url'
import { track } from '@everynews/logs'
import {
  checkSurgeVerification,
  sendChannelVerification,
  sendSlackVerification,
  sendSurgeVerification,
} from '@everynews/messengers'
import { channels, channelVerifications } from '@everynews/schema'
import {
  ChannelDtoSchema,
  ChannelSchema,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'

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
    zValidator('json', ChannelDtoSchema),
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
      const parsed = z.object({ destination: z.string() }).safeParse(config)
      if (parsed.success && parsed.data.destination === user.email) {
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

      const [inserted] = await db
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
    zValidator('json', ChannelDtoSchema),
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
      const parsedConfig = z
        .object({ destination: z.string() })
        .safeParse(request.config)
      if (
        parsedConfig.success &&
        parsedConfig.data.destination === user.email
      ) {
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
      const existingParsed = z
        .object({ destination: z.string() })
        .safeParse(ChannelSchema.parse(existingChannel).config)
      const newParsed = z
        .object({ destination: z.string() })
        .safeParse(ChannelDtoSchema.parse(request).config)
      const emailChanged =
        existingParsed.success &&
        newParsed.success &&
        existingParsed.data.destination !== newParsed.data.destination

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
  .get(
    '/:id/subscription-count',
    describeRoute({
      description: 'Get subscription count for a channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ count: z.number() })),
            },
          },
          description: 'Subscription count',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()
      const user = c.get('user')
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Verify channel ownership
      const channel = await db.query.channels.findFirst({
        where: and(
          eq(channels.id, id),
          eq(channels.userId, user.id),
          isNull(channels.deletedAt),
        ),
      })

      if (!channel) {
        return c.json({ error: 'Channel not found' }, 404)
      }

      // Import subscriptions at the top of the function to avoid circular dependency
      const { subscriptions } = await import('@everynews/schema/subscription')

      // Count active subscriptions for this channel
      const [{ count }] = await db
        .select({ count: db.$count(subscriptions) })
        .from(subscriptions)
        .where(
          and(eq(subscriptions.channelId, id), isNull(subscriptions.deletedAt)),
        )

      return c.json({ count })
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

      // Import subscriptions at the top of the function to avoid circular dependency
      const { subscriptions } = await import('@everynews/schema/subscription')

      // Get channel and count subscriptions
      const channel = await db.query.channels.findFirst({
        where: and(
          eq(channels.id, id),
          eq(channels.userId, user.id),
          isNull(channels.deletedAt),
        ),
      })

      if (!channel) {
        return c.json({ error: 'Channel not found' }, 404)
      }

      // Count subscriptions that will be affected
      const [{ count: subscriptionCount }] = await db
        .select({ count: db.$count(subscriptions) })
        .from(subscriptions)
        .where(
          and(eq(subscriptions.channelId, id), isNull(subscriptions.deletedAt)),
        )

      // Soft delete subscriptions linked to this channel
      if (subscriptionCount > 0) {
        await db
          .update(subscriptions)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(subscriptions.channelId, id),
              isNull(subscriptions.deletedAt),
            ),
          )

        await track({
          channel: 'channels',
          description: `Soft deleted ${subscriptionCount} subscriptions linked to channel: ${id}`,
          event: 'Subscriptions Soft Deleted',
          icon: '🔗',
          tags: {
            channel_id: id,
            subscription_count: subscriptionCount,
            type: 'info',
          },
          user_id: user.id,
        })
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
        description: `Deleted channel: ${id} (with ${subscriptionCount} subscriptions)`,
        event: 'Channel Deleted',
        icon: '🗑️',
        tags: {
          channel_id: id,
          subscription_count: subscriptionCount,
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
        422: {
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  error: z.object({
                    detail: z.record(z.string(), z.array(z.string())),
                    message: z.string(),
                    type: z.string(),
                  }),
                }),
              ),
            },
          },
          description: 'Validation error',
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

      const verificationLink = `${url}/verify/channel/${token}`

      // Handle different channel types
      if (channel.type === 'email') {
        const parsed = z
          .object({ destination: z.string() })
          .safeParse(channel.config)
        if (!parsed.success) {
          return c.json({ error: 'Invalid email channel configuration' }, 400)
        }
        await sendChannelVerification({
          channelName: channel.name,
          email: parsed.data.destination,
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
      } else if (channel.type === 'phone') {
        // For phone, store the verification ID from Surge
        const parsed = z
          .object({ destination: z.string() })
          .safeParse(channel.config)
        if (!parsed.success) {
          return c.json({ error: 'Invalid phone channel configuration' }, 400)
        }
        const verificationId = await sendSurgeVerification({
          phoneNumber: parsed.data.destination,
        })

        // Update the verification record with the Surge verification ID
        await db
          .update(channelVerifications)
          .set({ token: verificationId }) // Store Surge verification ID as token
          .where(eq(channelVerifications.token, token))

        await track({
          channel: 'channels',
          description: `Sent verification SMS for channel: ${channel.name}`,
          event: 'Channel Verification SMS Sent',
          icon: '📱',
          tags: {
            channel_id: id,
            channel_name: channel.name,
          },
          user_id: user.id,
        })
      } else if (channel.type === 'slack') {
        // For Slack, send a test message to verify the channel
        const parsedSlack = SlackChannelConfigSchema.safeParse(channel.config)
        if (!parsedSlack.success) {
          return c.json({ error: 'Invalid Slack channel configuration' }, 400)
        }
        const config = parsedSlack.data

        let decryptedToken: string
        try {
          decryptedToken = await decrypt(config.accessToken)
        } catch (error) {
          console.error('Failed to decrypt Slack access token:', error)
          return c.json(
            {
              error:
                'Failed to decrypt access token. Please reconnect to Slack.',
              success: false,
            },
            500,
          )
        }

        if (!config.channel?.id) {
          return c.json(
            {
              error:
                'Slack channel not configured. Please select a channel first.',
              success: false,
            },
            400,
          )
        }

        await sendSlackVerification({
          accessToken: decryptedToken,
          channelId: config.channel.id,
          channelName: channel.name,
        })

        // Mark as verified immediately since we sent the verification message
        await db
          .update(channels)
          .set({
            verified: true,
            verifiedAt: new Date(),
          })
          .where(eq(channels.id, id))

        await track({
          channel: 'channels',
          description: `Sent verification message to Slack channel: ${channel.name}`,
          event: 'Slack Channel Verification Sent',
          icon: '💬',
          tags: {
            channel_id: id,
            channel_name: channel.name,
          },
          user_id: user.id,
        })
      }

      return c.json({
        isPhone: channel.type === 'phone',
        isSlack: channel.type === 'slack',
        success: true,
      })
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
  .post(
    '/:id/verify-phone',
    describeRoute({
      description: 'Verify phone channel with code',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
          description: 'Phone verified successfully',
        },
      },
    }),
    zValidator('json', z.object({ code: z.string().regex(/^[0-9]{6}$/) })),
    async (c) => {
      const { id } = c.req.param()
      const { code } = await c.req.json()
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

      if (channel.type !== 'phone') {
        return c.json({ error: 'Not a phone channel' }, 400)
      }

      if (channel.verified) {
        return c.json({ error: 'Channel already verified' }, 400)
      }

      // Find the most recent verification for this channel
      const verification = await db.query.channelVerifications.findFirst({
        orderBy: (channelVerifications, { desc }) => [
          desc(channelVerifications.createdAt),
        ],
        where: and(
          eq(channelVerifications.channelId, id),
          eq(channelVerifications.used, false),
          gt(channelVerifications.expiresAt, new Date()),
        ),
      })

      if (!verification) {
        return c.json({ error: 'No active verification found' }, 400)
      }

      // Check the code with Surge
      const isValid = await checkSurgeVerification({
        code, // We stored the Surge verification ID as token
        verificationId: verification.token,
      })

      if (!isValid) {
        return c.json({ error: 'Invalid verification code' }, 400)
      }

      // Update channel as verified
      await db
        .update(channels)
        .set({
          verified: true,
          verifiedAt: new Date(),
        })
        .where(eq(channels.id, id))

      // Mark verification as used
      await db
        .update(channelVerifications)
        .set({ used: true })
        .where(eq(channelVerifications.id, verification.id))

      await track({
        channel: 'channels',
        description: `Phone channel verified: ${channel.name}`,
        event: 'Phone Channel Verified',
        icon: '✅',
        tags: {
          channel_id: channel.id,
          channel_name: channel.name,
        },
        user_id: user.id,
      })

      return c.json({ success: true })
    },
  )
