import { db } from '@everynews/drizzle'
import { track } from '@everynews/logs'
import { channels } from '@everynews/schema'
import { ChannelDtoSchema, ChannelSchema } from '@everynews/schema/channel'
import { authMiddleware } from '@everynews/server/middleware/auth'
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
        .where(eq(channels.userId, user.id))

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
        await track({
          channel: 'channels',
          description: 'User tried to create channel without authentication',
          event: 'Unauthorized Channel Creation',
          icon: '🚫',
          tags: {
            type: 'error',
          },
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
        .returning()

      await track({
        channel: 'channels',
        description: `Created new ${type} channel: ${name}`,
        event: 'Channel Created',
        icon: '✅',
        tags: {
          channel_name: name,
          channel_type: type,
        },
        user_id: user.id,
      })

      return c.json(inserted)
    },
  )
  .put(
    '/:id',
    describeRoute({
      description: 'Update Channel by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Update Channel by ID',
        },
      },
    }),
    validator('json', ChannelDtoSchema),
    async (c) => {
      const { id } = c.req.param()
      const request = await c.req.json()
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'channels',
          description: 'User tried to update channel without authentication',
          event: 'Unauthorized Channel Update',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db
        .update(channels)
        .set({ ...request, updatedAt: new Date() })
        .where(and(eq(channels.id, id), eq(channels.userId, user.id)))
        .returning()

      await track({
        channel: 'channels',
        description: `Updated channel: ${id}`,
        event: 'Channel Updated',
        icon: '✏️',
        tags: {
          channel_id: id,
          fields_updated: Object.keys(request).join(', '),
        },
        user_id: user.id,
      })

      return c.json(result)
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
        await track({
          channel: 'channels',
          description: 'User tried to delete channel without authentication',
          event: 'Unauthorized Channel Deletion',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db
        .delete(channels)
        .where(and(eq(channels.id, id), eq(channels.userId, user.id)))
        .returning()

      await track({
        channel: 'channels',
        description: `Deleted channel: ${id}`,
        event: 'Channel Deleted',
        icon: '🗑️',
        tags: {
          channel_id: id,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
