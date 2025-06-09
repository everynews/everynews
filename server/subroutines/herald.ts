import { db } from '@everynews/drizzle'
import Newsletter from '@everynews/emails/newsletter'
import { track } from '@everynews/logs'
import { ChannelSchema, channels, type Story } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const sendNewsletterEmail = async (parcel: {
  destination: string
  newsletterName: string
  stories: Story[]
}) => {
  try {
    await resend.emails.send({
      from: 'Everynews <onboarding@resend.dev>',
      react: Newsletter({ stories: parcel.stories }),
      subject: parcel.stories[0].title ?? parcel.newsletterName,
      to: parcel.destination,
    })

    await track({
      channel: 'herald',
      description: `Sent email to ${parcel.destination}`,
      event: 'Email Newsletter Sent',
      icon: '📧',
      tags: {
        destination: parcel.destination,
        newsletter_name: parcel.newsletterName,
        stories_count: parcel.stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to send email to ${parcel.destination}`,
      event: 'Email Newsletter Failed',
      icon: '❌',
      tags: {
        destination: parcel.destination,
        error: String(error),
        newsletter_name: parcel.newsletterName,
        type: 'error',
      },
    })
    throw error
  }
}

const sendNewsletterSlack = async (parcel: {
  destination: string
  newsletterName: string
  stories: Story[]
}) => {
  try {
    console.log(
      `Sending slack message to ${parcel.destination} for ${parcel.newsletterName} with ${parcel.stories.length} stories`,
    )

    await track({
      channel: 'herald',
      description: `Sent slack message to ${parcel.destination}`,
      event: 'Slack Newsletter Sent',
      icon: '💬',
      tags: {
        destination: parcel.destination,
        newsletter_name: parcel.newsletterName,
        stories_count: parcel.stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to send slack message to ${parcel.destination}`,
      event: 'Slack Newsletter Failed',
      icon: '❌',
      tags: {
        destination: parcel.destination,
        error: String(error),
        newsletter_name: parcel.newsletterName,
        type: 'error',
      },
    })
    throw error
  }
}

export const herald = async (
  channelId: string,
  newsletterName: string,
  stories: Story[],
) => {
  try {
    await track({
      channel: 'herald',
      description: `Starting to send newsletter "${newsletterName}"`,
      event: 'Newsletter Delivery Started',
      icon: '📨',
      tags: {
        channel_id: channelId,
        newsletter_name: newsletterName,
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
      newsletterName,
      stories,
    }

    const channelType = channel.type as 'email' | 'slack'
    if (channelType === 'email') await sendNewsletterEmail(parcel)
    else if (channelType === 'slack') await sendNewsletterSlack(parcel)
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
      description: `Successfully delivered newsletter "${newsletterName}"`,
      event: 'Newsletter Delivery Completed',
      icon: '✅',
      tags: {
        channel_id: channelId,
        channel_type: channel.type,
        newsletter_name: newsletterName,
        stories_count: stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'herald',
      description: `Failed to deliver newsletter "${newsletterName}"`,
      event: 'Newsletter Delivery Failed',
      icon: '💥',
      tags: {
        channel_id: channelId,
        error: String(error),
        newsletter_name: newsletterName,
        type: 'error',
      },
    })
    throw error
  }
}
