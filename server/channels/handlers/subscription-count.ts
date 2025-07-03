import { db } from '@everynews/database'
import { channels, subscriptions } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { and, eq, isNull } from 'drizzle-orm'
import type { Context } from 'hono'

export const getSubscriptionCount = async (c: Context<WithAuth>) => {
  const { id } = c.req.param()
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Verify channel ownership
  const [channel] = await db
    .select()
    .from(channels)
    .where(
      and(
        eq(channels.id, id),
        eq(channels.userId, user.id),
        isNull(channels.deletedAt),
      ),
    )

  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404)
  }

  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.channelId, id), isNull(subscriptions.deletedAt)),
    )

  return c.json({ count: activeSubscriptions.length })
}
