import { track } from '@everynews/logs'
import type { Story, Strategy, WaitSchema } from '@everynews/schema'
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
      alertName,
      stories,
      strategy,
      wait,
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
        message_ts: result.ts,
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
  strategy,
  wait,
}: {
  alertName: string
  stories: Story[]
  strategy: Strategy
  wait: Wait
}) => {
  const blocks: any[] = []

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
    const storyBlock: any = {
      text: {
        text: `*<${story.url}|${story.title}>*\n${story.description || ''}`.slice(
          0,
          3000,
        ),
        type: 'mrkdwn',
      },
      type: 'section',
    }

    // Add thumbnail if available
    if (story.imageUrl) {
      storyBlock.accessory = {
        alt_text: story.title || 'Story image',
        image_url: story.imageUrl,
        type: 'image',
      }
    }

    blocks.push(storyBlock)

    // Add context with metadata
    const contextElements = []

    if (story.source) {
      contextElements.push({
        emoji: true,
        text: story.source,
        type: 'plain_text',
      })
    }

    if (story.publishedAt) {
      const publishedDate = new Date(story.publishedAt)
      const now = new Date()
      const diffHours = Math.floor(
        (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60),
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
      })
    }

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
        text: `📰 Delivered by <${process.env.NEXT_PUBLIC_SITE_URL || 'https://every.news'}|Every.news>`,
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
            text: `✅ This Slack channel is now connected to Every.news!\n\nYour alerts for *${channelName}* will be delivered here.`,
            type: 'mrkdwn',
          },
          type: 'section',
        },
        {
          elements: [
            {
              text: `Connected by <${process.env.NEXT_PUBLIC_SITE_URL || 'https://every.news'}|Every.news>`,
              type: 'mrkdwn',
            },
          ],
          type: 'context',
        },
      ],
      channel: channelId,
      text: 'Every.news channel verification',
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
