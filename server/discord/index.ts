import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { channels, DiscordChannelConfigSchema } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'
import { generateInstallUrl, handleOAuthCallback } from './oauth-installer'

export const DiscordRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/install',
    describeRoute({
      description: 'Start Discord OAuth installation',
      responses: {
        302: {
          description: 'Redirect to Discord OAuth',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      try {
        // Generate the installation URL
        const url = await generateInstallUrl(user.id)

        await track({
          channel: 'discord',
          description: 'User initiated Discord installation',
          event: 'Discord Install Started',
          icon: '🔗',
          tags: {
            type: 'info',
          },
          user_id: user.id,
        })

        return c.redirect(url)
      } catch (error) {
        await track({
          channel: 'discord',
          description: 'Failed to generate Discord install URL',
          event: 'Discord Install Error',
          icon: '❌',
          tags: {
            error: String(error),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.json({ error: 'Failed to start Discord installation' }, 500)
      }
    },
  )
  .get(
    '/callback',
    describeRoute({
      description: 'Handle Discord OAuth callback',
      responses: {
        302: {
          description: 'Redirect to channel selection',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { code, state } = c.req.query()

      try {
        if (!code || !state) {
          throw new Error('Missing authorization code or state')
        }

        // Handle the OAuth callback
        const channelId = await handleOAuthCallback(code, state, user.id)

        // Redirect to channel selection page
        return c.redirect(`/my/channels/${channelId}/discord-setup`)
      } catch (error) {
        await track({
          channel: 'discord',
          description: 'Error handling Discord callback',
          event: 'Discord Callback Error',
          icon: '💥',
          tags: {
            error: String(error),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.redirect('/channels?error=discord_callback_error')
      }
    },
  )
  .post(
    '/channels',
    describeRoute({
      description: 'List available Discord channels',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  channels: z.array(
                    z.object({
                      id: z.string(),
                      name: z.string(),
                      type: z.number(),
                    }),
                  ),
                }),
              ),
            },
          },
          description: 'List of Discord channels',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { channelId } = await c.req.json<{ channelId: string }>()

      try {
        // Get the channel to retrieve the bot token
        const channel = await db.query.channels.findFirst({
          where: and(
            eq(channels.id, channelId),
            eq(channels.userId, user.id),
            eq(channels.type, 'discord'),
            isNull(channels.deletedAt),
          ),
        })

        if (!channel) {
          return c.json({ error: 'Channel not found' }, 404)
        }

        const config = DiscordChannelConfigSchema.parse(channel.config)

        // Use Discord API to get channels
        const response = await fetch(
          `https://discord.com/api/v10/guilds/${config.guildId}/channels`,
          {
            headers: {
              Authorization: `Bot ${config.botToken}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Discord API error: ${response.statusText}`)
        }

        interface DiscordChannel {
          id: string
          name: string
          type: number
        }

        const discordChannels: DiscordChannel[] = await response.json()

        // Filter only text channels (type 0)
        const textChannels = discordChannels
          .filter((ch) => ch.type === 0)
          .map((ch) => ({
            id: ch.id,
            name: ch.name,
            type: ch.type,
          }))

        await track({
          channel: 'discord',
          description: `Retrieved ${textChannels.length} Discord channels`,
          event: 'Discord Channels Listed',
          icon: '📋',
          tags: {
            channels_count: textChannels.length,
            type: 'info',
          },
          user_id: user.id,
        })

        return c.json({ channels: textChannels })
      } catch (error) {
        await track({
          channel: 'discord',
          description: 'Failed to list Discord channels',
          event: 'Discord Channels Error',
          icon: '❌',
          tags: {
            error: String(error),
            type: 'error',
          },
          user_id: user.id,
        })

        return c.json({ error: 'Failed to list channels' }, 500)
      }
    },
  )
  .post(
    '/test',
    describeRoute({
      description: 'Test Discord connection',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
          description: 'Test result',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const { channelId } = await c.req.json<{ channelId: string }>()

      try {
        // Get the channel
        const channel = await db.query.channels.findFirst({
          where: and(
            eq(channels.id, channelId),
            eq(channels.userId, user.id),
            eq(channels.type, 'discord'),
            isNull(channels.deletedAt),
          ),
        })

        if (!channel) {
          return c.json({ error: 'Channel not found' }, 404)
        }

        const config = DiscordChannelConfigSchema.parse(channel.config)

        if (!config.channel?.id) {
          return c.json({ error: 'Discord channel not configured' }, 400)
        }

        // Send test message using Discord API
        const response = await fetch(
          `https://discord.com/api/v10/channels/${config.channel.id}/messages`,
          {
            body: JSON.stringify({
              content: `Test message from Everynews! Your Discord channel is successfully connected.`,
            }),
            headers: {
              Authorization: `Bot ${config.botToken}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          },
        )

        if (!response.ok) {
          throw new Error(`Discord API error: ${response.statusText}`)
        }

        await track({
          channel: 'discord',
          description: 'Discord test message sent',
          event: 'Discord Test Success',
          icon: '✅',
          tags: {
            channel_id: channelId,
            type: 'info',
          },
          user_id: user.id,
        })

        return c.json({ success: true })
      } catch (error) {
        await track({
          channel: 'discord',
          description: 'Failed to send Discord test message',
          event: 'Discord Test Failed',
          icon: '❌',
          tags: {
            channel_id: channelId,
            error: String(error),
            type: 'error',
          },
          user_id: user.id,
        })

        return c.json({ error: 'Failed to send test message' }, 500)
      }
    },
  )
