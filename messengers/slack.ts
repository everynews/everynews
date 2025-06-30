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
    const blocks = buildSlackBlocks(stories)

    await track({
      channel: 'slack',
      description: `Built ${blocks.length} blocks for Slack message`,
      event: 'Slack Blocks Built',
      icon: '🏗️',
      tags: {
        alert_name: alertName,
        blocks_count: blocks.length,
        channel_id: channelId,
        type: 'info',
      },
    })

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
        ok: result.ok || false,
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

const buildSlackBlocks = (stories: Story[]) => {
  const blocks: KnownBlock[] = []

  // Send title with link and then the URL again for preview
  stories.forEach((story, index) => {
    const everynewsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://every.news'}/stories/${story.id}`
    const blockText = `<${everynewsUrl}|${story.title}>\n${everynewsUrl}`

    blocks.push({
      text: {
        text: blockText,
        type: 'mrkdwn',
      },
      type: 'section',
    })

    // Log details about each story block
    if (index === 0) {
      track({
        channel: 'slack',
        description: `First story block: "${story.title?.substring(0, 50)}..."`,
        event: 'Slack Block Sample',
        icon: '📄',
        tags: {
          block_text_length: blockText.length,
          everynews_url: everynewsUrl,
          story_id: story.id,
          story_title: story.title || 'untitled',
          type: 'info',
        },
      })
    }
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
