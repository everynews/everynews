import { db } from '@everynews/database'
import { decrypt } from '@everynews/lib/crypto'
import { channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { DiscordChannelSelectorClient } from './discord-channel-selector-client'

interface DiscordChannelSelectorProps {
  channelId: string
}

// Zod schema for validating Discord channel config
const DiscordConfigSchema = z.object({
  botToken: z.string(),
  channel: z
    .object({
      id: z.string(),
      name: z.string(),
      type: z.number(),
    })
    .optional(),
  destination: z.string().optional(),
  guild: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  guildId: z.string(),
})

// Server component for fetching Discord channels
export const DiscordChannelSelector = async ({
  channelId,
}: DiscordChannelSelectorProps) => {
  // Fetch the channel to get the bot token
  const [channelData] = await db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1)

  if (!channelData) {
    return <div>Channel not found</div>
  }

  // Validate the config using Zod
  const configResult = DiscordConfigSchema.safeParse(channelData.config)

  if (!configResult.success) {
    console.error('Invalid Discord channel config:', configResult.error)
    return <div>Invalid channel configuration</div>
  }

  const config = configResult.data

  if (!config.botToken || !config.guildId) {
    return <div>Channel not connected to Discord</div>
  }

  // Fetch Discord channels server-side
  let discordChannels: Array<{ id: string; name: string; type: number }> = []
  let error = null

  try {
    // Decrypt the bot token
    const decryptedToken = await decrypt(config.botToken)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const discordResponse = await fetch(
      `https://discord.com/api/v10/guilds/${config.guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${decryptedToken}`,
        },
        method: 'GET',
        signal: controller.signal,
      },
    )

    // Clear timeout if request completes
    clearTimeout(timeoutId)

    if (discordResponse.ok) {
      const data = await discordResponse.json()
      // Filter only text channels (type 0)
      discordChannels = data
        .filter((ch: { type: number }) => ch.type === 0)
        .map((ch: { id: string; name: string; type: number }) => ({
          id: ch.id,
          name: ch.name,
          type: ch.type,
        }))
    } else {
      error =
        'Failed to connect to Discord. Please check your connection and try again.'
    }
  } catch (e) {
    // Log detailed error for debugging but show generic message to user
    console.error('Discord API error:', e)

    if (e instanceof Error && e.name === 'AbortError') {
      error = 'Request timed out. Please try again.'
    } else {
      error = 'Unable to load Discord channels. Please try again later.'
    }
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <DiscordChannelSelectorClient
      channelId={channelId}
      channels={discordChannels}
    />
  )
}
