'use server'

import { db } from '@everynews/database'
import { channels } from '@everynews/schema/channel'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export const updateSlackChannel = async (
  channelId: string,
  slackChannelId: string,
  slackChannelName: string,
) => {
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

    // Update with preserved config
    const existingConfig = existingChannel.config as {
      accessToken: string
      teamId: string
      workspace: { id: string; name: string }
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
  } catch (error) {
    throw new Error(`Failed to update Slack channel: ${JSON.stringify(error)}`)
  }

  redirect('/channels')
}
