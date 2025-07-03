import { url } from '@everynews/lib/url'
import { track } from '@everynews/logs'
import type { Story } from '@everynews/schema'

export const sendDiscordAlert = async ({
  botToken,
  channelId,
  alertName,
  stories,
}: {
  botToken: string
  channelId: string
  alertName: string
  stories: Story[]
}): Promise<void> => {
  await track({
    channel: 'discord',
    description: `Attempting to send Discord alert "${alertName}" to channel ${channelId}`,
    event: 'Discord Alert Starting',
    icon: '🚀',
    tags: {
      alert_name: alertName,
      channel_id: channelId,
      stories_count: stories.length,
      type: 'info',
    },
  })

  try {
    // Send each story URL as a separate message
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i]
      const everynewsUrl = `${url}/stories/${story.id}`

      await track({
        channel: 'discord',
        description: `Sending story ${i + 1} of ${stories.length} to Discord`,
        event: 'Discord Message Sending',
        icon: '📤',
        tags: {
          alert_name: alertName,
          channel_id: channelId,
          story_index: i,
          story_url: everynewsUrl,
          type: 'info',
        },
      })

      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          body: JSON.stringify({
            content: everynewsUrl,
          }),
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Discord API error: ${response.statusText} - ${JSON.stringify(errorData)}`,
        )
      }

      const messageData = await response.json()

      await track({
        channel: 'discord',
        description: `Sent story ${i + 1} to channel ${channelId}`,
        event: 'Discord Message Sent',
        icon: '💬',
        tags: {
          alert_name: alertName,
          channel_id: channelId,
          message_id: messageData.id || '',
          story_index: i,
          story_url: everynewsUrl,
          type: 'info',
        },
      })
    }

    await track({
      channel: 'discord',
      description: `Sent all ${stories.length} messages to channel ${channelId}`,
      event: 'Discord Alert Complete',
      icon: '✅',
      tags: {
        alert_name: alertName,
        channel_id: channelId,
        stories_count: stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    const errorDetails =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n')[0] || '',
          }
        : { raw: String(error) }

    await track({
      channel: 'discord',
      description: `Failed to send Discord alert to channel ${channelId}: ${error instanceof Error ? error.message : String(error)}`,
      event: 'Discord Alert Failed',
      icon: '❌',
      tags: {
        alert_name: alertName,
        channel_id: channelId,
        error: String(error),
        error_details: JSON.stringify(errorDetails),
        type: 'error',
      },
    })

    throw error
  }
}

export const sendDiscordVerification = async ({
  botToken,
  channelId,
  channelName,
}: {
  botToken: string
  channelId: string
  channelName: string
}): Promise<void> => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        body: JSON.stringify({
          embeds: [
            {
              author: {
                name: 'Everynews',
                url,
              },
              color: 0x00ff00, // Green color
              description: `✅ This Discord channel is now connected to Everynews!\n\nYour alerts for **${channelName}** will be delivered here.`,
              footer: {
                text: 'Connected by Everynews',
              },
              timestamp: new Date().toISOString(),
              title: 'Channel Verification',
            },
          ],
        }),
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        `Discord API error: ${response.statusText} - ${JSON.stringify(errorData)}`,
      )
    }

    await track({
      channel: 'discord',
      description: `Sent verification message to Discord channel ${channelId}`,
      event: 'Discord Verification Sent',
      icon: '✅',
      tags: {
        channel_id: channelId,
        channel_name: channelName,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'discord',
      description: `Failed to send verification to Discord channel ${channelId}`,
      event: 'Discord Verification Failed',
      icon: '❌',
      tags: {
        channel_id: channelId,
        channel_name: channelName,
        error: String(error),
        type: 'error',
      },
    })

    throw error
  }
}
