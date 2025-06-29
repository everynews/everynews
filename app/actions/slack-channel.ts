'use server'

import { whoami } from '@everynews/auth/session'
import { db } from '@everynews/database'
import { channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect, unauthorized } from 'next/navigation'

export const updateSlackChannel = async (
  channelId: string,
  slackChannelId: string,
  slackChannelName: string,
) => {
  // Check if user is authenticated
  const user = await whoami()
  if (!user) return unauthorized()

  try {
    // First get the existing channel to preserve config
    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1)

    if (!existingChannel) {
      throw new Error('Channel not found')
    }

    // Verify the user owns this channel
    if (existingChannel.userId !== user.id) {
      throw new Error(
        'Unauthorized: You do not have permission to update this channel',
      )
    }

    // Validate and extract existing config
    const existingConfig = existingChannel.config

    // Runtime validation of config structure
    if (
      !existingConfig ||
      typeof existingConfig !== 'object' ||
      !('accessToken' in existingConfig) ||
      !('teamId' in existingConfig) ||
      typeof existingConfig.accessToken !== 'string' ||
      typeof existingConfig.teamId !== 'string'
    ) {
      throw new Error('Invalid channel configuration structure')
    }

    // Validate workspace if it exists
    if (
      existingConfig.workspace &&
      (typeof existingConfig.workspace !== 'object' ||
        !('id' in existingConfig.workspace) ||
        !('name' in existingConfig.workspace) ||
        typeof existingConfig.workspace.id !== 'string' ||
        typeof existingConfig.workspace.name !== 'string')
    ) {
      throw new Error('Invalid workspace configuration structure')
    }

    await db
      .update(channels)
      .set({
        config: {
          ...existingConfig,
          channel: {
            id: slackChannelId,
            name: slackChannelName,
          },
          destination: `#${slackChannelName}`,
        },
        name: `Slack - ${slackChannelName}`,
        type: 'slack',
        updatedAt: new Date(),
      })
      .where(eq(channels.id, channelId))

    revalidatePath('/channels')
    redirect('/channels')
  } catch (error) {
    console.error('Failed to update Slack channel:', error)
    throw new Error('Failed to update Slack channel. Please try again.')
  }
}
