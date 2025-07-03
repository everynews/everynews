import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'
import { ChannelDtoSchema, ChannelSchema } from '@everynews/schema/channel'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { and, eq, isNull } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { checkSignInEmailConflict } from '../utils/validation'

export const updateChannel = async (c: Context<WithAuth>) => {
  const { id } = c.req.param()
  const request = await c.req.json()
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Check if channel exists
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

  // Check for sign-in email conflict
  const conflictResponse = checkSignInEmailConflict(
    request.config,
    user.email,
    request.type,
  )
  if (conflictResponse) {
    await track({
      channel: 'channels',
      description: 'User tried to update channel with sign-in email',
      event: 'Duplicate Sign-in Email',
      icon: '⚠️',
      tags: {
        channel_id: id,
        type: 'warning',
      },
      user_id: user.id,
    })
    return c.json(conflictResponse, 400)
  }

  // Check if email address has changed
  const existingParsed = z
    .object({ destination: z.string() })
    .safeParse(ChannelSchema.parse(existingChannel).config)
  const newParsed = z
    .object({ destination: z.string() })
    .safeParse(ChannelDtoSchema.parse(request).config)
  const emailChanged =
    existingParsed.success &&
    newParsed.success &&
    existingParsed.data.destination !== newParsed.data.destination

  // If email changed and channel was verified, mark as unverified
  const updateData = {
    ...request,
    updatedAt: new Date(),
    ...(emailChanged && existingChannel.verified
      ? {
          verified: false,
          verifiedAt: null,
        }
      : {}),
  }

  const result = await db
    .update(channels)
    .set(updateData)
    .where(
      and(
        eq(channels.id, id),
        eq(channels.userId, user.id),
        isNull(channels.deletedAt),
      ),
    )
    .returning()

  await track({
    channel: 'channels',
    description:
      emailChanged && existingChannel.verified
        ? `Updated channel: ${id} (email changed, marked as unverified)`
        : `Updated channel: ${id}`,
    event: 'Channel Updated',
    icon: '✏️',
    tags: {
      channel_id: id,
      email_changed: String(emailChanged),
      fields_updated: Object.keys(request).join(', '),
      verification_reset: String(emailChanged && existingChannel.verified),
    },
    user_id: user.id,
  })

  return c.json(result)
}
