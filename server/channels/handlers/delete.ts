import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { channels, subscriptions } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { and, eq, isNull } from 'drizzle-orm'
import type { Context } from 'hono'

export const deleteChannel = async (c: Context<WithAuth>) => {
  const { id } = c.req.param()
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [existingChannel] = await db
    .select()
    .from(channels)
    .where(
      and(
        eq(channels.id, id),
        eq(channels.userId, user.id),
        isNull(channels.deletedAt),
      ),
    )

  if (!existingChannel) {
    return c.json({ error: 'Channel not found' }, 404)
  }

  // Check if channel has active subscriptions
  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.channelId, id), isNull(subscriptions.deletedAt)),
    )

  if (activeSubscriptions.length > 0) {
    return c.json(
      {
        count: activeSubscriptions.length,
        error: 'Cannot delete channel with active subscriptions',
      },
      400,
    )
  }

  // Soft delete
  await db
    .update(channels)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(channels.id, id),
        eq(channels.userId, user.id),
        isNull(channels.deletedAt),
      ),
    )

  await track({
    channel: 'channels',
    description: `Deleted channel: ${id}`,
    event: 'Channel Deleted',
    icon: '🗑️',
    tags: {
      channel_id: id,
      channel_name: existingChannel.name,
      channel_type: existingChannel.type,
    },
    user_id: user.id,
  })

  return c.json({ success: true })
}
