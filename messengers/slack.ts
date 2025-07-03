import { url } from '@everynews/lib/url'
import { track } from '@everynews/logs'
import type { Story } from '@everynews/schema'
import { isTokenError } from '@everynews/server/slack/token-refresh'
import { WebClient } from '@slack/web-api'

export const sendSlackAlert = async ({
  accessToken,
  channelId,
  alertName,
  stories,
}: {
  accessToken: string
  channelId: string
  alertName: string
  stories: Story[]
}): Promise<void> => {
  await track({
    channel: 'slack',
    description: `Attempting to send Slack alert "${alertName}" to channel ${channelId}`,
    event: 'Slack Alert Starting',
    icon: '🚀',
    tags: {
      alert_name: alertName,
      channel_id: channelId,
      stories_count: stories.length,
      token_prefix: `${accessToken.substring(0, 10)}...`,
      type: 'info',
    },
  })

  try {
    const slack = new WebClient(accessToken)

    // Send each story URL as a separate message
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i]
      const everynewsUrl = `${url}/stories/${story.id}`

      await track({
        channel: 'slack',
        description: `Sending story ${i + 1} of ${stories.length} to Slack`,
        event: 'Slack Message Sending',
        icon: '📤',
        tags: {
          alert_name: alertName,
          channel_id: channelId,
          story_index: i,
          story_url: everynewsUrl,
          type: 'info',
        },
      })

      const result = await slack.chat.postMessage({
        channel: channelId,
        text: everynewsUrl,
      })

      await track({
        channel: 'slack',
        description: `Sent story ${i + 1} to channel ${channelId}`,
        event: 'Slack Message Sent',
        icon: '💬',
        tags: {
          alert_name: alertName,
          channel_id: channelId,
          message_ts: result.ts || '',
          ok: result.ok || false,
          story_index: i,
          story_url: everynewsUrl,
          type: 'info',
        },
      })
    }

    await track({
      channel: 'slack',
      description: `Sent all ${stories.length} messages to channel ${channelId}`,
      event: 'Slack Alert Complete',
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
      channel: 'slack',
      description: `Failed to send Slack alert to channel ${channelId}: ${error instanceof Error ? error.message : String(error)}`,
      event: 'Slack Alert Failed',
      icon: '❌',
      tags: {
        alert_name: alertName,
        channel_id: channelId,
        error: String(error),
        error_details: JSON.stringify(errorDetails),
        is_token_error: isTokenError(error),
        type: 'error',
      },
    })

    if (isTokenError(error)) {
      throw new Error(
        'Slack authentication expired. Please reconnect your Slack channel.',
      )
    }

    throw error
  }
}

export const sendSlackVerification = async ({
  accessToken,
  channelId,
  channelName,
}: {
  accessToken: string
  channelId: string
  channelName: string
}): Promise<void> => {
  try {
    const slack = new WebClient(accessToken)

    await slack.chat.postMessage({
      blocks: [
        {
          text: {
            emoji: true,
            text: 'Channel Verification',
            type: 'plain_text',
          },
          type: 'header',
        },
        {
          text: {
            text: `✅ This Slack channel is now connected to Everynews!\n\nYour alerts for *${channelName}* will be delivered here.`,
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          elements: [
            {
              text: `Connected by <${url}|Everynews>`,
              type: 'mrkdwn',
            },
          ],
          type: 'context',
        },
      ],
      channel: channelId,
      text: 'Everynews channel verification',
    })

    await track({
      channel: 'slack',
      description: `Sent verification message to Slack channel ${channelId}`,
      event: 'Slack Verification Sent',
      icon: '✅',
      tags: {
        channel_id: channelId,
        channel_name: channelName,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'slack',
      description: `Failed to send verification to Slack channel ${channelId}`,
      event: 'Slack Verification Failed',
      icon: '❌',
      tags: {
        channel_id: channelId,
        channel_name: channelName,
        error: String(error),
        is_token_error: isTokenError(error),
        type: 'error',
      },
    })

    if (isTokenError(error)) {
      throw new Error(
        'Slack authentication expired. Please reconnect your Slack channel.',
      )
    }

    throw error
  }
}
