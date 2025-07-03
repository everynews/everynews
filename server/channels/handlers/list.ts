import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { and, eq, isNull } from 'drizzle-orm'
import type { Context } from 'hono'

export const listChannels = async (c: Context<WithAuth>) => {
  const user = c.get('user')
  if (!user) {
    await track({
      channel: 'channels',
      description: 'User tried to access channels without authentication',
      event: 'Unauthorized Access',
      icon: '🚫',
      tags: {
        type: 'error',
      },
    })
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = await db
    .select()
    .from(channels)
    .where(and(eq(channels.userId, user.id), isNull(channels.deletedAt)))

  await track({
    channel: 'channels',
    description: `Retrieved ${result.length} channels for user`,
    event: 'Channels Retrieved',
    icon: '📋',
    tags: {
      count: result.length,
    },
    user_id: user.id,
  })

  return c.json(result)
}
