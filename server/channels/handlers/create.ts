import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import type { Context } from 'hono'
import { checkSignInEmailConflict } from '../utils/validation'

export const createChannel = async (c: Context<WithAuth>) => {
  const { name, type, config } = await c.req.json()
  const user = c.get('user')
  if (!user) {
    await track({
      channel: 'channels',
      description: 'User tried to create channel without authentication',
      event: 'Unauthorized Access',
      icon: '🚫',
      tags: {
        channel_type: type,
        type: 'error',
      },
    })
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Check for sign-in email conflict
  const conflictResponse = checkSignInEmailConflict(config, user.email, type)
  if (conflictResponse) {
    await track({
      channel: 'channels',
      description: 'User tried to create channel with sign-in email',
      event: 'Duplicate Sign-in Email',
      icon: '⚠️',
      tags: {
        channel_type: type,
        type: 'warning',
      },
      user_id: user.id,
    })
    return c.json(conflictResponse, 400)
  }

  const result = await db
    .insert(channels)
    .values({
      config,
      name,
      type,
      userId: user.id,
    })
    .returning()

  await track({
    channel: 'channels',
    description: `Created new ${type} channel: ${name}`,
    event: 'Channel Created',
    icon: '➕',
    tags: {
      channel_id: result[0].id,
      channel_type: type,
    },
    user_id: user.id,
  })

  return c.json(result[0])
}
