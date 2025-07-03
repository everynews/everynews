import { db } from '@everynews/database'
import { sendTemplateEmail } from '@everynews/emails'
import Alert from '@everynews/emails/alert'
import { decrypt } from '@everynews/lib/crypto'
import { track } from '@everynews/logs'
import {
  sendDiscordAlert,
  sendSlackAlert,
  sendSmsAlert,
} from '@everynews/messengers'
import {
  ChannelSchema,
  channels,
  DiscordChannelConfigSchema,
  SlackChannelConfigSchema,
  type Story,
  type Strategy,
  type WaitSchema,
} from '@everynews/schema'
import { getValidSlackToken } from '@everynews/server/slack/token-refresh'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

type Wait = z.infer<typeof WaitSchema>

const sendAlertEmail = async (parcel: {
  alertName: string
  destination: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  subscriptionId?: string
  wait: Wait
}) => {
  try {
    await sendTemplateEmail({
      subject: parcel.stories[0].title ?? parcel.alertName,
      template: Alert({
        alertName: parcel.alertName,
        readerCount: parcel.readerCount,
        stories: parcel.stories,
        strategy: parcel.strategy,
        subscriptionId: parcel.subscriptionId,
        wait: parcel.wait,
      }),
      to: parcel.destination,
    })

    await track({
      channel: 'herald',
      description: `Sent email to ${parcel.destination}`,
      event: 'Email Alert Sent',
      icon: '📧',
      tags: {
        alert_name: parcel.alertName,
        destination: parcel.destination,
        stories_count: parcel.stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to send email to ${parcel.destination}`,
      event: 'Email Alert Failed',
      icon: '❌',
      tags: {
        alert_name: parcel.alertName,
        destination: parcel.destination,
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}

const sendAlertSlack = async (parcel: {
  alertName: string
  destination: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  wait: Wait
  channelId: string
  config: z.infer<typeof SlackChannelConfigSchema>
}) => {
  await track({
    channel: 'herald',
    description: `Starting Slack delivery for alert "${parcel.alertName}" to channel ${parcel.config.channel?.name || 'unknown'} (${parcel.config.channel?.id || 'unknown'})`,
    event: 'Slack Delivery Starting',
    icon: '🚀',
    tags: {
      alert_name: parcel.alertName,
      channel_id: parcel.channelId,
      has_refresh_token: !!parcel.config.refreshToken,
      slack_channel_id: parcel.config.channel?.id || 'unknown',
      slack_channel_name: parcel.config.channel?.name || 'unknown',
      stories_count: parcel.stories.length,
      team_id: parcel.config.teamId,
      token_expires_at: parcel.config.expiresAt?.toISOString() || 'never',
      token_rotation_enabled: parcel.config.tokenRotationEnabled || false,
      type: 'info',
      workspace_name: parcel.config.workspace?.name || 'unknown',
    },
  })

  try {
    // Ensure channel is configured
    if (!parcel.config.channel?.id) {
      throw new Error('Slack channel not properly configured')
    }

    const accessToken = await getValidSlackToken(parcel.channelId)

    await track({
      channel: 'herald',
      description: `Retrieved valid Slack token for channel ${parcel.channelId}`,
      event: 'Slack Token Retrieved',
      icon: '🔑',
      tags: {
        channel_id: parcel.channelId,
        token_length: accessToken.length,
        type: 'info',
      },
    })

    await sendSlackAlert({
      accessToken,
      alertName: parcel.alertName,
      channelId: parcel.config.channel.id,
      stories: parcel.stories,
    })

    await track({
      channel: 'herald',
      description: `Successfully sent Slack alert "${parcel.alertName}" to channel ${parcel.config.channel?.name || 'unknown'}`,
      event: 'Slack Delivery Completed',
      icon: '✅',
      tags: {
        alert_name: parcel.alertName,
        channel_id: parcel.channelId,
        slack_channel_id: parcel.config.channel?.id || 'unknown',
        slack_channel_name: parcel.config.channel?.name || 'unknown',
        stories_count: parcel.stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to send Slack alert "${parcel.alertName}": ${String(error)}`,
      event: 'Slack Delivery Failed',
      icon: '❌',
      tags: {
        alert_name: parcel.alertName,
        channel_id: parcel.channelId,
        error: String(error),
        error_message: error instanceof Error ? error.message : String(error),
        error_name: error instanceof Error ? error.name : 'unknown',
        slack_channel_id: parcel.config.channel?.id || 'unknown',
        slack_channel_name: parcel.config.channel?.name || 'unknown',
        type: 'error',
      },
    })
    throw error
  }
}

const sendAlertDiscord = async (parcel: {
  alertName: string
  destination: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  wait: Wait
  channelId: string
  config: z.infer<typeof DiscordChannelConfigSchema>
}) => {
  await track({
    channel: 'herald',
    description: `Starting Discord delivery for alert "${parcel.alertName}" to channel ${parcel.config.channel?.name || 'unknown'} (${parcel.config.channel?.id || 'unknown'})`,
    event: 'Discord Delivery Starting',
    icon: '🚀',
    tags: {
      alert_name: parcel.alertName,
      channel_id: parcel.channelId,
      discord_channel_id: parcel.config.channel?.id || 'unknown',
      discord_channel_name: parcel.config.channel?.name || 'unknown',
      guild_id: parcel.config.guildId,
      guild_name: parcel.config.guild?.name || 'unknown',
      stories_count: parcel.stories.length,
      type: 'info',
    },
  })

  try {
    // Ensure channel is configured
    if (!parcel.config.channel?.id) {
      throw new Error('Discord channel not properly configured')
    }

    const botToken = await decrypt(parcel.config.botToken)

    await track({
      channel: 'herald',
      description: `Retrieved Discord bot token for channel ${parcel.channelId}`,
      event: 'Discord Token Retrieved',
      icon: '🔑',
      tags: {
        channel_id: parcel.channelId,
        type: 'info',
      },
    })

    await sendDiscordAlert({
      alertName: parcel.alertName,
      botToken,
      channelId: parcel.config.channel.id,
      stories: parcel.stories,
    })

    await track({
      channel: 'herald',
      description: `Successfully sent Discord alert "${parcel.alertName}" to channel ${parcel.config.channel?.name || 'unknown'}`,
      event: 'Discord Delivery Completed',
      icon: '✅',
      tags: {
        alert_name: parcel.alertName,
        channel_id: parcel.channelId,
        discord_channel_id: parcel.config.channel?.id || 'unknown',
        discord_channel_name: parcel.config.channel?.name || 'unknown',
        stories_count: parcel.stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to send Discord alert "${parcel.alertName}": ${String(error)}`,
      event: 'Discord Delivery Failed',
      icon: '❌',
      tags: {
        alert_name: parcel.alertName,
        channel_id: parcel.channelId,
        discord_channel_id: parcel.config.channel?.id || 'unknown',
        discord_channel_name: parcel.config.channel?.name || 'unknown',
        error: String(error),
        error_message: error instanceof Error ? error.message : String(error),
        error_name: error instanceof Error ? error.name : 'unknown',
        type: 'error',
      },
    })
    throw error
  }
}

export const herald = async ({
  channelId,
  alertName,
  readerCount,
  stories,
  strategy,
  subscriptionId,
  wait,
  user,
}: {
  channelId: string | null
  alertName: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  subscriptionId?: string
  wait: Wait
  user?: { id: string; email: string }
}) => {
  try {
    await track({
      channel: 'herald',
      description: `Starting to send alert "${alertName}"`,
      event: 'Alert Delivery Started',
      icon: '📨',
      tags: {
        alert_name: alertName,
        channel_id: channelId || 'default',
        stories_count: stories.length,
        type: 'info',
      },
    })

    let parcel: {
      alertName: string
      destination: string
      readerCount: number
      stories: Story[]
      strategy: Strategy
      subscriptionId?: string
      wait: Wait
    }
    let channelType: 'email' | 'phone' | 'slack' | 'discord' = 'email'

    if (!channelId) {
      // Handle default channel (user's email)
      if (!user?.email) {
        await track({
          channel: 'herald',
          description: 'No channel ID and no user email provided',
          event: 'Missing Destination',
          icon: '❌',
          tags: {
            type: 'error',
          },
        })
        throw new Error('No channel ID and no user email provided')
      }

      parcel = {
        alertName,
        destination: user.email,
        readerCount,
        stories,
        strategy,
        subscriptionId,
        wait,
      }
    } else {
      // Handle regular channel
      const channel = ChannelSchema.parse(
        await db.query.channels.findFirst({
          where: and(eq(channels.id, channelId), isNull(channels.deletedAt)),
        }),
      )

      if (!channel) {
        await track({
          channel: 'herald',
          description: `Channel ${channelId} not found`,
          event: 'Channel Not Found',
          icon: '❌',
          tags: {
            channel_id: channelId,
            type: 'error',
          },
        })
        throw new Error(`Channel ${channelId} not found`)
      }

      // Parse destination for email/phone channels
      let destination = ''
      if (channel.type === 'email' || channel.type === 'phone') {
        const parsed = z
          .object({ destination: z.string() })
          .safeParse(channel.config)
        if (parsed.success) {
          destination = parsed.data.destination
        } else {
          await track({
            channel: 'herald',
            description: `Invalid config for ${channel.type} channel ${channelId}`,
            event: 'Invalid Channel Config',
            icon: '❌',
            tags: {
              channel_id: channelId,
              channel_type: channel.type,
              type: 'error',
            },
          })
          throw new Error(
            `Invalid config for ${channel.type} channel ${channelId}`,
          )
        }
      }

      parcel = {
        alertName,
        destination,
        readerCount,
        stories,
        strategy,
        subscriptionId,
        wait,
      }
      channelType = channel.type as 'email' | 'phone' | 'slack' | 'discord'

      // Send the alert for Slack channels with config
      if (channelType === 'slack') {
        await track({
          channel: 'herald',
          description: `Processing Slack channel ${channelId} for alert "${alertName}"`,
          event: 'Slack Channel Processing',
          icon: '🔍',
          tags: {
            alert_name: alertName,
            channel_id: channelId,
            channel_type: channelType,
            config_keys: String(Object.keys(channel.config || {})),
            type: 'info',
          },
        })

        const slackConfig = SlackChannelConfigSchema.parse(channel.config)

        await track({
          channel: 'herald',
          description: `Slack config parsed for channel ${channelId}`,
          event: 'Slack Config Parsed',
          icon: '📋',
          tags: {
            channel_id: channelId,
            channel_id_config: slackConfig.channel?.id || 'none',
            channel_name_config: slackConfig.channel?.name || 'none',
            has_access_token: !!slackConfig.accessToken,
            has_channel: !!slackConfig.channel,
            has_refresh_token: !!slackConfig.refreshToken,
            team_id: slackConfig.teamId || 'none',
            type: 'info',
            workspace_name: slackConfig.workspace?.name || 'none',
          },
        })

        // Ensure Slack channel is properly configured
        if (!slackConfig.channel?.id) {
          await track({
            channel: 'herald',
            description: `Slack channel not configured for channel ${channelId}`,
            event: 'Slack Channel Not Configured',
            icon: '⚠️',
            tags: {
              channel_id: channelId,
              type: 'error',
            },
          })
          throw new Error(
            `Slack channel ${channelId} is not properly configured. Please select a channel.`,
          )
        }

        await sendAlertSlack({
          ...parcel,
          channelId,
          config: slackConfig,
        })
        return
      }

      // Send the alert for Discord channels with config
      if (channelType === 'discord') {
        await track({
          channel: 'herald',
          description: `Processing Discord channel ${channelId} for alert "${alertName}"`,
          event: 'Discord Channel Processing',
          icon: '🔍',
          tags: {
            alert_name: alertName,
            channel_id: channelId,
            channel_type: channelType,
            config_keys: String(Object.keys(channel.config || {})),
            type: 'info',
          },
        })

        const discordConfig = DiscordChannelConfigSchema.parse(channel.config)

        await track({
          channel: 'herald',
          description: `Parsed Discord config for channel ${channelId}`,
          event: 'Discord Config Parsed',
          icon: '✅',
          tags: {
            channel_id: channelId,
            discord_channel_id: discordConfig.channel?.id || 'not set',
            discord_channel_name: discordConfig.channel?.name || 'not set',
            guild_id: discordConfig.guildId,
            guild_name: discordConfig.guild?.name || 'unknown',
            has_bot_token: !!discordConfig.botToken,
            has_channel: !!discordConfig.channel,
            type: 'info',
          },
        })

        if (!discordConfig.channel?.id) {
          await track({
            channel: 'herald',
            description: `Discord channel not configured for channel ${channelId}`,
            event: 'Discord Channel Not Configured',
            icon: '⚠️',
            tags: {
              channel_id: channelId,
              type: 'error',
            },
          })
          throw new Error(
            `Discord channel ${channelId} is not properly configured. Please select a channel.`,
          )
        }

        await sendAlertDiscord({
          ...parcel,
          channelId,
          config: discordConfig,
        })
        return
      }
    }

    // Send the alert for email/phone channels
    if (channelType === 'email') await sendAlertEmail(parcel)
    else if (channelType === 'phone')
      await sendSmsAlert({
        alertName: parcel.alertName,
        phoneNumber: parcel.destination,
        stories: parcel.stories,
      })
    else {
      await track({
        channel: 'herald',
        description: `Unsupported channel type: ${channelType}`,
        event: 'Unsupported Channel',
        icon: '❌',
        tags: {
          channel_id: channelId ?? 'default',
          channel_type: channelType,
          type: 'error',
        },
      })
      throw new Error(`Unsupported channel type: ${channelType}`)
    }

    await track({
      channel: 'herald',
      description: `Successfully delivered alert "${alertName}"`,
      event: 'Alert Delivery Completed',
      icon: '✅',
      tags: {
        alert_name: alertName,
        channel_id: channelId || 'default',
        channel_type: channelType,
        stories_count: stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to deliver alert "${alertName}"`,
      event: 'Alert Delivery Failed',
      icon: '💥',
      tags: {
        alert_name: alertName,
        channel_id: channelId || 'default',
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}
