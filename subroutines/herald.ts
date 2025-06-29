import { db } from '@everynews/database'
import { sendTemplateEmail } from '@everynews/emails'
import Alert from '@everynews/emails/alert'
import { decrypt } from '@everynews/lib/crypto'
import { track } from '@everynews/logs'
import { sendSlackAlert, sendSurgeAlert } from '@everynews/messengers'
import {
  ChannelSchema,
  channels,
  type Story,
  type Strategy,
  type WaitSchema,
} from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'
import type { z } from 'zod'

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

const sendAlertPhone = async (parcel: {
  alertName: string
  destination: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  wait: Wait
}) => {
  await sendSurgeAlert({
    alertName: parcel.alertName,
    phoneNumber: parcel.destination,
    stories: parcel.stories,
    strategy: parcel.strategy,
    wait: parcel.wait,
  })
}

const sendAlertSlack = async (parcel: {
  alertName: string
  destination: string
  readerCount: number
  stories: Story[]
  strategy: Strategy
  wait: Wait
  config: {
    accessToken: string
    channel: { id: string; name: string }
    destination?: string
    teamId: string
    workspace: { id: string; name: string }
  }
}) => {
  await sendSlackAlert({
    accessToken: await decrypt(parcel.config.accessToken),
    alertName: parcel.alertName,
    channelId: parcel.config.channel.id,
    stories: parcel.stories,
    strategy: parcel.strategy,
    wait: parcel.wait,
  })
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
    let channelType: 'email' | 'phone' | 'slack' = 'email'

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

      parcel = {
        alertName,
        destination: channel.config.destination || '',
        readerCount,
        stories,
        strategy,
        subscriptionId,
        wait,
      }
      channelType = channel.type as 'email' | 'phone' | 'slack'

      // Send the alert for Slack channels with config
      if (channelType === 'slack') {
        await sendAlertSlack({
          ...parcel,
          config: channel.config as {
            accessToken: string
            channel: { id: string; name: string }
            destination?: string
            teamId: string
            workspace: { id: string; name: string }
          },
        })
        return
      }
    }

    // Send the alert for email/phone channels
    if (channelType === 'email') await sendAlertEmail(parcel)
    else if (channelType === 'phone') await sendAlertPhone(parcel)
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
