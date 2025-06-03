import { db } from '@everynews/drizzle'
import { channels } from '@everynews/schema'
import { ChannelDtoSchema, ChannelSchema } from '@everynews/schema/channel'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { trackEvent } from '@everynews/server/lib/logsnag'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'

export const ChannelRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/',
    describeRoute({
      description: 'Get All Channels',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema.array()),
            },
          },
          description: 'Get All Channels',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        await trackEvent({
          channel: 'channels',
          event: 'Unauthorized Access',
          description: 'User tried to access channels without authentication',
          icon: '🚫',
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const result = await db
        .select()
        .from(channels)
        .where(eq(channels.userId, user.id))
        .execute()
      
      await trackEvent({
        channel: 'channels',
        event: 'Channels Retrieved',
        description: `Retrieved ${result.length} channels for user`,
        icon: '📋',
        user_id: user.id,
        tags: {
          count: result.length,
        },
      })
      
      return c.json(result)
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Create Channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Create Channel',
        },
      },
    }),
    validator('json', ChannelDtoSchema),
    async (c) => {
      const { name, type, config } = await c.req.json()
      const user = c.get('user')
      if (!user) {
        await trackEvent({
          channel: 'channels',
          event: 'Unauthorized Channel Creation',
          description: 'User tried to create channel without authentication',
          icon: '🚫',
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const inserted = await db
        .insert(channels)
        .values({
          config,
          name,
          type,
          userId: user.id,
        })
        .execute()
      
      await trackEvent({
        channel: 'channels',
        event: 'Channel Created',
        description: `Created new ${type} channel: ${name}`,
        icon: '✅',
        user_id: user.id,
        tags: {
          channel_name: name,
          channel_type: type,
        },
      })
      
      return c.json(inserted)
    },
  )
  .delete(
    '/:id',
    describeRoute({
      description: 'Delete Channel by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Delete Channel by ID',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()
      const user = c.get('user')
      if (!user) {
        await trackEvent({
          channel: 'channels',
          event: 'Unauthorized Channel Deletion',
          description: 'User tried to delete channel without authentication',
          icon: '🚫',
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const result = await db
        .delete(channels)
        .where(and(eq(channels.id, id), eq(channels.userId, user.id)))
        .execute()
      
      await trackEvent({
        channel: 'channels',
        event: 'Channel Deleted',
        description: `Deleted channel: ${id}`,
        icon: '🗑️',
        user_id: user.id,
        tags: {
          channel_id: id,
        },
      })
      
      return c.json(result)
    },
  )
