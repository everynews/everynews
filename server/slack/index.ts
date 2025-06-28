import { db } from '@everynews/database'
import { decrypt, encrypt } from '@everynews/lib/crypto'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { InstallProvider } from '@slack/oauth'
import { WebClient } from '@slack/web-api'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'

// Initialize Slack OAuth installer
const installer = new InstallProvider({
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  installationStore: {
    deleteInstallation: async (query) => {
      // Not needed for our use case
      throw new Error('Not implemented')
    },
    fetchInstallation: async (query) => {
      // Not needed for our use case
      throw new Error('Not implemented')
    },
    // We'll store tokens in our channels table
    storeInstallation: async (installation) => {
      // This is handled in the callback
      return
    },
  },
  scopes: ['channels:read', 'chat:write', 'chat:write.public'],
  stateSecret: process.env.SLACK_STATE_SECRET || 'my-state-secret',
})

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
        // Generate the installation URL
        const url = await installer.generateInstallUrl({
          // Pass state to track the user
          metadata: JSON.stringify({ userId: user.id }),
          redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/slack/callback`,
        })

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
        // Handle the OAuth callback
        const installation = await installer.handleCallback(c.req.raw, {
          failure: async (error, options, req, res) => {
            await track({
              channel: 'slack',
              description: 'Slack installation failed',
              event: 'Slack Install Failed',
              icon: '❌',
              tags: {
                error: String(error),
                type: 'error',
              },
              user_id: user.id,
            })
            return c.redirect('/channels?error=slack_install_failed')
          },
          success: async (installation, options, req, res) => {
            // Extract user ID from state
            const metadata = JSON.parse(options.metadata || '{}')
            const userId = metadata.userId

            if (userId !== user.id) {
              throw new Error('User mismatch')
            }

            // Create a temporary Slack channel to store OAuth data
            // The user will update this with their selected channel later
            const slackData = {
              accessToken: installation.access_token!,
              botUserId: installation.bot?.bot_user_id || '',
              teamId: installation.team?.id || '',
              teamName: installation.team?.name || '',
            }

            // Create a temporary channel entry
            const [tempChannel] = await db
              .insert(channels)
              .values({
                config: {
                  accessToken: encrypt(slackData.accessToken),
                  channel: {
                    id: '',
                    name: '',
                  },
                  destination: '',
                  teamId: slackData.teamId,
                  workspace: {
                    id: slackData.teamId,
                    name: slackData.teamName,
                  },
                },
                name: `Slack - ${slackData.teamName} (Select Channel)`,
                type: 'slack',
                userId: user.id,
                verified: false,
              })
              .returning()

            await track({
              channel: 'slack',
              description: `Slack workspace connected: ${slackData.teamName}`,
              event: 'Slack Workspace Connected',
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
          },
        })

        return installation
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

        const config = channel.config as any
        const accessToken = decrypt(config.accessToken)

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
            id: channel.id!,
            is_private: channel.is_private || false,
            name: channel.name!,
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

        const config = channel.config as any
        const accessToken = decrypt(config.accessToken)
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
