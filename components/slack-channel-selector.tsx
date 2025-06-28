import { db } from '@everynews/database'
import { channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import { SlackChannelSelectorClient } from './slack-channel-selector-client'

interface SlackChannelSelectorProps {
  channelId: string
}

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

  const config = channelData.config as {
    accessToken?: string
    teamId?: string
    workspace?: { id: string; name: string }
  }

  if (!config.accessToken) {
    return <div>Channel not connected to Slack</div>
  }

  // Fetch Slack channels server-side
  let slackChannels: Array<{ id: string; name: string; is_private: boolean }> =
    []
  let error = null

  try {
    const slackResponse = await fetch(
      'https://slack.com/api/conversations.list',
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      },
    )

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
        error = 'Failed to fetch Slack channels'
      }
    } else {
      error = 'Failed to connect to Slack'
    }
  } catch (e) {
    error = `Error loading Slack channels: ${JSON.stringify(e)}`
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
