import { db } from '@everynews/database'
import { encrypt } from '@everynews/lib/crypto'
import { url } from '@everynews/lib/url'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'

// Helper to generate OAuth URL
if (process.env.DISCORD_STATE_SECRET === undefined) {
  throw new Error('DISCORD_STATE_SECRET is not set')
}

if (process.env.DISCORD_CLIENT_ID === undefined) {
  throw new Error('DISCORD_CLIENT_ID is not set')
}

if (process.env.DISCORD_CLIENT_SECRET === undefined) {
  throw new Error('DISCORD_CLIENT_SECRET is not set')
}

if (process.env.DISCORD_BOT_TOKEN === undefined) {
  throw new Error('DISCORD_BOT_TOKEN is not set')
}

export async function generateInstallUrl(userId: string): Promise<string> {
  const clientId = process.env.DISCORD_CLIENT_ID
  const stateSecret = process.env.DISCORD_STATE_SECRET

  if (!clientId || !stateSecret) {
    throw new Error('Missing Discord OAuth configuration')
  }

  // Generate state with user ID
  const state = Buffer.from(
    JSON.stringify({ secret: stateSecret, userId }),
  ).toString('base64')

  // Discord OAuth URL with bot permissions
  const params = new URLSearchParams({
    client_id: clientId,
    permissions: '2048', // Send Messages permission
    redirect_uri: `${url}/api/discord/callback`,
    response_type: 'code',
    scope: 'bot applications.commands',
    state,
  })

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`
}

// Helper to handle OAuth callback
export async function handleOAuthCallback(
  code: string,
  state: string,
  userId: string,
): Promise<string> {
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  const botToken = process.env.DISCORD_BOT_TOKEN
  const stateSecret = process.env.DISCORD_STATE_SECRET

  if (!clientId || !clientSecret || !botToken || !stateSecret) {
    throw new Error('Missing Discord OAuth configuration')
  }

  // Verify state
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    if (stateData.userId !== userId || stateData.secret !== stateSecret) {
      throw new Error('Invalid state')
    }
  } catch (_error) {
    throw new Error('State verification failed')
  }

  // Exchange code for access token to get guild information
  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${url}/api/discord/callback`,
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })

  const data = await response.json()

  if (!response.ok || !data.access_token) {
    throw new Error(`OAuth failed: ${data.error || 'Unknown error'}`)
  }

  // Get guild information from the OAuth response
  const { guild } = data

  if (!guild) {
    throw new Error('No guild information in OAuth response')
  }

  // Prepare the Discord configuration
  const discordData = {
    botToken: await encrypt(botToken), // Use the bot token from env
    guild: {
      id: guild.id,
      name: guild.name,
    },
    guildId: guild.id,
  }

  // Create a temporary Discord channel to store OAuth data
  const [tempChannel] = await db
    .insert(channels)
    .values({
      config: discordData,
      name: `Discord: ${guild.name}`,
      type: 'discord',
      userId,
    })
    .returning()

  await track({
    channel: 'discord',
    description: 'Discord installation successful',
    event: 'Discord Install Success',
    icon: '✅',
    tags: {
      channel_id: tempChannel.id,
      guild_id: guild.id,
      guild_name: guild.name,
      type: 'info',
    },
    user_id: userId,
  })

  return tempChannel.id
}
