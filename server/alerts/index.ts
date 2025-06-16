import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { alert } from '@everynews/schema'
import { AlertDtoSchema, AlertSchema } from '@everynews/schema/alert'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'

export const AlertRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/',
    describeRoute({
      description: 'Get All Alerts',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(AlertSchema.array()),
            },
          },
          description: 'Get All Alerts',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'alerts',
          description: 'User tried to access alerts without authentication',
          event: 'Unauthorized Access',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db.select().from(alert)

      await track({
        channel: 'alerts',
        description: `Retrieved ${result.length} alert items`,
        event: 'Alert List Retrieved',
        icon: '🚨',
        tags: {
          count: result.length,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
  .get(
    '/:id',
    describeRoute({
      description: 'Get Alert by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(AlertSchema),
            },
          },
          description: 'Get Alert by ID',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()

      const result = await db.select().from(alert).where(eq(alert.id, id))

      await track({
        channel: 'alerts',
        description: `Retrieved Alert ${id}`,
        event: 'Alert Item Retrieved',
        icon: '🚨',
        tags: {
          alert_id: id,
          found: String(result.length > 0),
          type: 'info',
        },
      })

      return c.json(result)
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Create Alert',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(AlertSchema),
            },
          },
          description: 'Create Alert',
        },
      },
    }),
    validator('json', AlertDtoSchema),
    async (c) => {
      const {
        name,
        strategy,
        wait,
        isPublic,
        description,
        language,
        promptId,
        active,
        threshold,
      } = await c.req.json()
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'alerts',
          description: 'User tried to create alert without authentication',
          event: 'Unauthorized Alert Creation',
          icon: '🚫',
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const [inserted] = await db
        .insert(alert)
        .values({
          active,
          description,
          isPublic,
          language,
          name,
          promptId,
          strategy,
          threshold,
          userId: user.id,
          wait,
        })
        .returning()

      await track({
        channel: 'alerts',
        description: `Created alert: ${name}`,
        event: 'Alert Created',
        icon: '✅',
        tags: {
          alert_id: inserted.id,
          alert_name: name,
          is_public: isPublic,
          strategy_provider: strategy.provider,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(inserted)
    },
  )
  .put(
    '/:id',
    describeRoute({
      description: 'Update Alert by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(AlertSchema),
            },
          },
          description: 'Update Alert by ID',
        },
      },
    }),
    validator('json', AlertDtoSchema),
    async (c) => {
      const { id } = c.req.param()
      const request = await c.req.json()

      const result = await db
        .update(alert)
        .set({ ...request })
        .where(eq(alert.id, id))
        .returning()

      await track({
        channel: 'alerts',
        description: `Updated Alert ${id}`,
        event: 'Alert Updated',
        icon: '✏️',
        tags: {
          alert_id: id,
          fields_updated: Object.keys(request).join(', '),
          type: 'info',
        },
      })

      return c.json(result)
    },
  )
  .delete(
    '/:id',
    describeRoute({
      description: 'Delete Alert by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(AlertSchema),
            },
          },
          description: 'Delete Alert by ID',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()
      const user = c.get('user')

      if (!user) {
        await track({
          channel: 'alerts',
          description: 'User tried to delete alert without authentication',
          event: 'Unauthorized Alert Deletion',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db.delete(alert).where(eq(alert.id, id)).returning()

      await track({
        channel: 'alerts',
        description: `Deleted Alert ${id}`,
        event: 'Alert Deleted',
        icon: '🗑️',
        tags: {
          alert_id: id,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
