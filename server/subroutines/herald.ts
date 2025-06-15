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
        alert_name: parcel.alertName,
        destination: parcel.destination,
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
        alert_name: parcel.alertName,
        destination: parcel.destination,
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}

export const herald = async ({
  channelId,
  alertName,
  stories,
  user,
}: {
  channelId: string | null
  alertName: string
  stories: Story[]
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

    let parcel: { alertName: string; destination: string; stories: Story[] }
    let channelType: 'email' | 'slack' = 'email'

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
        stories,
      }
    } else {
      // Handle regular channel
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

      parcel = {
        alertName,
        destination: channel.config.destination,
        stories,
      }
      channelType = channel.type as 'email' | 'slack'
    }

    // Send the alert
    if (channelType === 'email') await sendAlertEmail(parcel)
    else if (channelType === 'slack') await sendAlertSlack(parcel)
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
