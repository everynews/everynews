import { db } from '@everynews/database'
import { channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { SlackChannelSelectorClient } from './slack-channel-selector-client'

interface SlackChannelSelectorProps {
  channelId: string
}

// Zod schema for validating Slack channel config
const SlackConfigSchema = z.object({
  accessToken: z.string(),
  channel: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  destination: z.string().optional(),
  teamId: z.string(),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

// Server component for fetching Slack channels
export const SlackChannelSelector = async ({
  channelId,
}: SlackChannelSelectorProps) => {
  // Fetch the channel to get the access token
  const [channelData] = await db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1)

  if (!channelData) {
    return <div>Channel not found</div>
  }

  // Validate the config using Zod
  const configResult = SlackConfigSchema.safeParse(channelData.config)

  if (!configResult.success) {
    console.error('Invalid Slack channel config:', configResult.error)
    return <div>Invalid channel configuration</div>
  }

  const config = configResult.data

  if (!config.accessToken) {
    return <div>Channel not connected to Slack</div>
  }

  // Fetch Slack channels server-side
  let slackChannels: Array<{ id: string; name: string; is_private: boolean }> =
    []
  let error = null

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const slackResponse = await fetch(
      'https://slack.com/api/conversations.list',
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
        signal: controller.signal,
      },
    )

    // Clear timeout if request completes
    clearTimeout(timeoutId)

    if (slackResponse.ok) {
      const data = await slackResponse.json()
      if (data.ok && data.channels) {
        slackChannels = data.channels
          .filter(
            (ch: { is_member: boolean; is_archived: boolean }) =>
              ch.is_member && !ch.is_archived,
          )
          .map((ch: { id: string; is_private: boolean; name: string }) => ({
            id: ch.id,
            is_private: ch.is_private,
            name: ch.name,
          }))
      } else {
        error = 'Unable to retrieve Slack channels. Please try again later.'
      }
    } else {
      error =
        'Failed to connect to Slack. Please check your connection and try again.'
    }
  } catch (e) {
    // Log detailed error for debugging but show generic message to user
    console.error('Slack API error:', e)

    if (e instanceof Error && e.name === 'AbortError') {
      error = 'Request timed out. Please try again.'
    } else {
      error = 'Unable to load Slack channels. Please try again later.'
    }
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <SlackChannelSelectorClient
      channelId={channelId}
      channels={slackChannels}
    />
  )
}
