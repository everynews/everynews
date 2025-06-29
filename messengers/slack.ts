import { track } from '@everynews/logs'
import type { Story, Strategy, WaitSchema } from '@everynews/schema'
import type {
  ContextBlockElement,
  KnownBlock,
  PlainTextElement,
  SectionBlock,
} from '@slack/types'
import { WebClient } from '@slack/web-api'
import type { z } from 'zod'

type Wait = z.infer<typeof WaitSchema>

export const sendSlackAlert = async ({
  accessToken,
  channelId,
  alertName,
  stories,
  strategy,
  wait,
}: {
  accessToken: string
  channelId: string
  alertName: string
  stories: Story[]
  strategy: Strategy
  wait: Wait
}): Promise<void> => {
  try {
    const slack = new WebClient(accessToken)

    // Build the message blocks
    const blocks = buildSlackBlocks({
      _strategy: strategy,
      _wait: wait,
      alertName,
      stories,
    })

    const result = await slack.chat.postMessage({
      blocks,
      channel: channelId,
      text: `${alertName}: ${stories.length} new ${stories.length === 1 ? 'story' : 'stories'}`,
      unfurl_links: false,
      unfurl_media: false,
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
        type: 'error',
      },
    })
    throw error
  }
}

const buildSlackBlocks = ({
  alertName,
  stories,
  _strategy,
  _wait,
}: {
  alertName: string
  stories: Story[]
  _strategy: Strategy
  _wait: Wait
}) => {
  const blocks: KnownBlock[] = []

  // Header
  blocks.push({
    text: {
      emoji: true,
      text: alertName,
      type: 'plain_text',
    },
    type: 'header',
  })

  // Summary
  const summaryText = `${stories.length} new ${stories.length === 1 ? 'story' : 'stories'}`
  blocks.push({
    text: {
      text: summaryText,
      type: 'mrkdwn',
    },
    type: 'section',
  })

  // Divider
  blocks.push({ type: 'divider' })

  // Stories
  stories.slice(0, 10).forEach((story, index) => {
    // Story section
    const storyBlock: SectionBlock = {
      text: {
        text: `*<${story.url}|${story.title}>*`.slice(0, 3000),
        type: 'mrkdwn',
      },
      type: 'section',
    }

    // Thumbnail removed - not available in Story type

    blocks.push(storyBlock)

    // Add context with metadata
    const contextElements: ContextBlockElement[] = []

    if (story.originalUrl) {
      try {
        const url = new URL(story.originalUrl)
        contextElements.push({
          emoji: true,
          text: url.hostname,
          type: 'plain_text',
        } as PlainTextElement)
      } catch (_error) {
        // Skip adding hostname if URL is malformed
      }
    }

    // Use createdAt instead of publishedAt
    const createdDate = new Date(story.createdAt)
    const now = new Date()
    const diffHours = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60),
    )

    let timeAgo = ''
    if (diffHours < 1) {
      timeAgo = 'Just now'
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}h ago`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      timeAgo = `${diffDays}d ago`
    }

    contextElements.push({
      emoji: true,
      text: timeAgo,
      type: 'plain_text',
    } as PlainTextElement)

    if (contextElements.length > 0) {
      blocks.push({
        elements: contextElements,
        type: 'context',
      })
    }

    // Add divider between stories (but not after the last one)
    if (index < Math.min(stories.length - 1, 9)) {
      blocks.push({ type: 'divider' })
    }
  })

  // If there are more than 10 stories, add a note
  if (stories.length > 10) {
    blocks.push({ type: 'divider' })
    blocks.push({
      elements: [
        {
          text: `_+ ${stories.length - 10} more ${stories.length - 10 === 1 ? 'story' : 'stories'}_`,
          type: 'mrkdwn',
        },
      ],
      type: 'context',
    })
  }

  // Footer
  blocks.push({ type: 'divider' })
  blocks.push({
    elements: [
      {
        text: `📰 Delivered by <${process.env.NEXT_PUBLIC_SITE_URL || 'https://every.news'}|Everynews>`,
        type: 'mrkdwn',
      },
    ],
    type: 'context',
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
        type: 'error',
      },
    })
    throw error
  }
}
