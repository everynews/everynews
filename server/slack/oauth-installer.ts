import { db } from '@everynews/database'
import { encrypt } from '@everynews/lib/crypto'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'

// Helper to generate OAuth URL
export async function generateInstallUrl(userId: string): Promise<string> {
  const clientId = process.env.SLACK_CLIENT_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const stateSecret = process.env.SLACK_STATE_SECRET || 'default-state-secret'

  if (!clientId || !siteUrl) {
    throw new Error('Missing Slack OAuth configuration')
  }

  // Generate state with user ID
  const state = Buffer.from(
    JSON.stringify({ secret: stateSecret, userId }),
  ).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/slack/callback`,
    scope: 'channels:read,chat:write,chat:write.public',
    state,
  })

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`
}

// Helper to handle OAuth callback
export async function handleOAuthCallback(
  code: string,
  state: string,
  userId: string,
): Promise<string> {
  const clientId = process.env.SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const stateSecret = process.env.SLACK_STATE_SECRET || 'default-state-secret'

  if (!clientId || !clientSecret || !siteUrl) {
    throw new Error('Missing Slack OAuth configuration')
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

  // Exchange code for tokens
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${siteUrl}/api/slack/callback`,
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })

  const data = await response.json()

  if (!data.ok || !data.access_token) {
    throw new Error(`OAuth failed: ${data.error || 'Unknown error'}`)
  }

  // Check if token rotation is enabled
  const tokenRotationEnabled = !!data.refresh_token

  // Prepare the Slack configuration
  const slackData = {
    accessToken: await encrypt(data.access_token),
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
    refreshToken: data.refresh_token
      ? await encrypt(data.refresh_token)
      : undefined,
    teamId: data.team?.id || '',
    tokenRotationEnabled,
    workspace: {
      id: data.team?.id || '',
      name: data.team?.name || 'Unknown Workspace',
    },
  }

  // Create a temporary Slack channel to store OAuth data
  const [tempChannel] = await db
    .insert(channels)
    .values({
      config: slackData,
      name: `Slack: ${data.team?.name || 'Unknown Workspace'}`,
      type: 'slack',
      userId,
    })
    .returning()

  await track({
    channel: 'slack',
    description: 'Slack installation successful',
    event: 'Slack Install Success',
    icon: '✅',
    tags: {
      channel_id: tempChannel.id,
      team_id: data.team?.id || '',
      team_name: data.team?.name || '',
      token_rotation: tokenRotationEnabled,
      type: 'info',
    },
    user_id: userId,
  })

  return tempChannel.id
}

// Helper to refresh tokens
export async function refreshAccessToken(
  refreshToken: string,
  _teamId: string,
): Promise<{
  accessToken: string
  expiresAt?: Date
  refreshToken?: string
}> {
  const clientId = process.env.SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing Slack OAuth credentials')
  }

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })

  const data = await response.json()

  if (!data.ok || !data.access_token) {
    throw new Error(`Failed to refresh token: ${data.error || 'Unknown error'}`)
  }

  return {
    accessToken: data.access_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
    refreshToken: data.refresh_token,
  }
}
