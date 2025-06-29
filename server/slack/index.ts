import { db } from '@everynews/database'
import { decrypt, encrypt } from '@everynews/lib/crypto'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { WebClient } from '@slack/web-api'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'

export const SlackRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/install',
    describeRoute({
      description: 'Start Slack OAuth installation',
      responses: {
        302: {
          description: 'Redirect to Slack OAuth',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      try {
        // Generate the installation URL manually
        const state = Buffer.from(JSON.stringify({ userId: user.id })).toString(
          'base64',
        )
        const params = new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID || '',
          redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/slack/callback`,
          scope: 'channels:read,chat:write,chat:write.public',
          state: state,
        })
        const url = `https://slack.com/oauth/v2/authorize?${params.toString()}`

        await track({
          channel: 'slack',
          description: 'User initiated Slack installation',
          event: 'Slack Install Started',
          icon: '🔗',
          tags: {
            type: 'info',
          },
          user_id: user.id,
        })

        return c.redirect(url)
      } catch (error) {
        await track({
          channel: 'slack',
          description: 'Failed to generate Slack install URL',
          event: 'Slack Install Error',
          icon: '❌',
          tags: {
            error: String(error),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.json({ error: 'Failed to start Slack installation' }, 500)
      }
    },
  )
  .get(
    '/callback',
    describeRoute({
      description: 'Handle Slack OAuth callback',
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
        // Manually handle OAuth token exchange since Hono uses Web API Request objects
        if (!code) {
          throw new Error('Missing authorization code')
        }

        // Exchange code for access token
        const slack = new WebClient()
        const result = await slack.oauth.v2.access({
          client_id: process.env.SLACK_CLIENT_ID || '',
          client_secret: process.env.SLACK_CLIENT_SECRET || '',
          code: code,
        })

        if (!result.ok || !result.access_token) {
          throw new Error('Failed to get access token')
        }

        // Parse state to get user ID
        const stateData = state
          ? JSON.parse(Buffer.from(state, 'base64').toString())
          : {}
        const userId = stateData.userId

        if (userId !== user.id) {
          throw new Error('User mismatch')
        }

        // Create a temporary Slack channel to store OAuth data
        const slackData = {
          accessToken: await encrypt(result.access_token),
          botUserId: result.bot_user_id || '',
          teamId: result.team?.id || '',
          teamName: result.team?.name || 'Unknown Team',
        }

        const [tempChannel] = await db
          .insert(channels)
          .values({
            config: slackData,
            name: `Slack: ${slackData.teamName}`,
            type: 'slack',
            userId: user.id,
          })
          .returning()

        await track({
          channel: 'slack',
          description: 'Slack installation successful',
          event: 'Slack Install Success',
          icon: '✅',
          tags: {
            channel_id: tempChannel.id,
            team_id: slackData.teamId,
            team_name: slackData.teamName,
            type: 'info',
          },
          user_id: user.id,
        })

        // Redirect to channel selection page
        return c.redirect(`/channels/${tempChannel.id}/slack-setup`)
      } catch (error) {
        await track({
          channel: 'slack',
          description: 'Error handling Slack callback',
          event: 'Slack Callback Error',
          icon: '💥',
          tags: {
            error: String(error),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.redirect('/channels?error=slack_callback_error')
      }
    },
  )
  .post(
    '/channels',
    describeRoute({
      description: 'List available Slack channels',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  channels: z.array(
                    z.object({
                      id: z.string(),
                      is_private: z.boolean(),
                      name: z.string(),
                    }),
                  ),
                }),
              ),
            },
          },
          description: 'List of Slack channels',
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
        // Get the channel to retrieve the access token
        const channel = await db.query.channels.findFirst({
          where: and(
            eq(channels.id, channelId),
            eq(channels.userId, user.id),
            eq(channels.type, 'slack'),
            isNull(channels.deletedAt),
          ),
        })

        if (!channel) {
          return c.json({ error: 'Channel not found' }, 404)
        }

        const config = channel.config as {
          accessToken: string
          channel: { id: string; name: string }
          destination: string
          teamId: string
          workspace: { id: string; name: string }
        }
        const accessToken = await decrypt(config.accessToken)

        // Initialize Slack client
        const slack = new WebClient(accessToken)

        // Get list of channels
        const result = await slack.conversations.list({
          exclude_archived: true,
          limit: 100,
          types: 'public_channel,private_channel',
        })

        const slackChannels =
          result.channels?.map((channel) => ({
            id: channel.id || '',
            is_private: channel.is_private || false,
            name: channel.name || '',
          })) || []

        await track({
          channel: 'slack',
          description: `Retrieved ${slackChannels.length} Slack channels`,
          event: 'Slack Channels Listed',
          icon: '📋',
          tags: {
            channels_count: slackChannels.length,
            type: 'info',
          },
          user_id: user.id,
        })

        return c.json({ channels: slackChannels })
      } catch (error) {
        await track({
          channel: 'slack',
          description: 'Failed to list Slack channels',
          event: 'Slack Channels Error',
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
      description: 'Test Slack connection',
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
            eq(channels.type, 'slack'),
            isNull(channels.deletedAt),
          ),
        })

        if (!channel) {
          return c.json({ error: 'Channel not found' }, 404)
        }

        const config = channel.config as {
          accessToken: string
          channel: { id: string; name: string }
          destination: string
          teamId: string
          workspace: { id: string; name: string }
        }
        const accessToken = await decrypt(config.accessToken)
        const slack = new WebClient(accessToken)

        // Send test message
        await slack.chat.postMessage({
          channel: config.channel.id,
          text: `Test message from Every.news! Your Slack channel is successfully connected.`,
        })

        await track({
          channel: 'slack',
          description: 'Slack test message sent',
          event: 'Slack Test Success',
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
          channel: 'slack',
          description: 'Failed to send Slack test message',
          event: 'Slack Test Failed',
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
