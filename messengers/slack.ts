import { track } from '@everynews/logs'
import type { Story } from '@everynews/schema'
import { isTokenError } from '@everynews/server/slack/token-refresh'
import type { KnownBlock } from '@slack/types'
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
  try {
    const slack = new WebClient(accessToken)
    const blocks = buildSlackBlocks(stories)

    const result = await slack.chat.postMessage({
      blocks,
      channel: channelId,
      text: `${alertName}: ${stories.length} new ${stories.length === 1 ? 'story' : 'stories'}`,
    })

    await track({
      channel: 'slack',
      description: `Sent Slack alert to channel ${channelId}`,
      event: 'Slack Alert Sent',
      icon: '💬',
      tags: {
        alert_name: alertName,
        channel_id: channelId,
        message_ts: result.ts || '',
        stories_count: stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'slack',
      description: `Failed to send Slack alert to channel ${channelId}`,
      event: 'Slack Alert Failed',
      icon: '❌',
      tags: {
        alert_name: alertName,
        channel_id: channelId,
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

const buildSlackBlocks = (stories: Story[]) => {
  const blocks: KnownBlock[] = []

  // Send title with link and then the URL again for preview
  stories.forEach((story) => {
    const everynewsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://every.news'}/stories/${story.id}`
    blocks.push({
      text: {
        text: `<${everynewsUrl}|${story.title}>\n${everynewsUrl}`,
        type: 'mrkdwn',
      },
      type: 'section',
    })
  })

  return blocks
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
              text: `Connected by <${process.env.NEXT_PUBLIC_SITE_URL || 'https://every.news'}|Everynews>`,
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
