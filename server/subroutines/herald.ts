import { db } from '@everynews/database'
import { Alert } from '@everynews/emails/alert'
import { track } from '@everynews/logs'
import { ChannelSchema, channels, type Story } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const sendAlertEmail = async (parcel: {
  destination: string
  alertName: string
  stories: Story[]
}) => {
  try {
    await resend.emails.send({
      from: 'Everynews <onboarding@resend.dev>',
      react: Alert({ stories: parcel.stories }),
      subject: parcel.stories[0].title ?? parcel.alertName,
      to: parcel.destination,
    })

    await track({
      channel: 'herald',
      description: `Sent email to ${parcel.destination}`,
      event: 'Email Alert Sent',
      icon: '📧',
      tags: {
        destination: parcel.destination,
        alert_name: parcel.alertName,
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
        destination: parcel.destination,
        error: String(error),
        alert_name: parcel.alertName,
        type: 'error',
      },
    })
    throw error
  }
}

const sendAlertSlack = async (parcel: {
  destination: string
  alertName: string
  stories: Story[]
}) => {
  try {
    console.log(
      `Sending slack message to ${parcel.destination} for ${parcel.alertName} with ${parcel.stories.length} stories`,
    )

    await track({
      channel: 'herald',
      description: `Sent slack message to ${parcel.destination}`,
      event: 'Slack Alert Sent',
      icon: '💬',
      tags: {
        destination: parcel.destination,
        alert_name: parcel.alertName,
        stories_count: parcel.stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to send slack message to ${parcel.destination}`,
      event: 'Slack Alert Failed',
      icon: '❌',
      tags: {
        destination: parcel.destination,
        error: String(error),
        alert_name: parcel.alertName,
        type: 'error',
      },
    })
    throw error
  }
}

export const herald = async (
  channelId: string,
  alertName: string,
  stories: Story[],
) => {
  try {
    await track({
      channel: 'herald',
      description: `Starting to send alert "${alertName}"`,
      event: 'Alert Delivery Started',
      icon: '📨',
      tags: {
        channel_id: channelId,
        alert_name: alertName,
        stories_count: stories.length,
        type: 'info',
      },
    })

    const channel = ChannelSchema.parse(
      await db.query.channels.findFirst({
        where: eq(channels.id, channelId),
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

    const parcel = {
      destination: channel.config.destination,
      alertName,
      stories,
    }

    const channelType = channel.type as 'email' | 'slack'
    if (channelType === 'email') await sendAlertEmail(parcel)
    else if (channelType === 'slack') await sendAlertSlack(parcel)
    else {
      await track({
        channel: 'herald',
        description: `Unsupported channel type: ${channelType}`,
        event: 'Unsupported Channel',
        icon: '❌',
        tags: {
          channel_id: channelId,
          channel_type: channelType,
          type: 'error',
        },
      })
      throw new Error(`Unsupported channel: ${JSON.stringify(channel)}`)
    }

    await track({
      channel: 'herald',
      description: `Successfully delivered alert "${alertName}"`,
      event: 'Alert Delivery Completed',
      icon: '✅',
      tags: {
        channel_id: channelId,
        channel_type: channel.type,
        alert_name: alertName,
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
        channel_id: channelId,
        error: String(error),
        alert_name: alertName,
        type: 'error',
      },
    })
    throw error
  }
}
