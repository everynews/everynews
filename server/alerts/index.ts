import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { alerts, subscriptions } from '@everynews/schema'
import { AlertDtoSchema, AlertSchema } from '@everynews/schema/alert'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { TestAlertRouter } from './test'

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

      const result = await db
        .select()
        .from(alerts)
        .where(isNull(alerts.deletedAt))

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
      const user = c.get('user')

      const result = await db
        .select()
        .from(alerts)
        .where(and(eq(alerts.id, id), isNull(alerts.deletedAt)))

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
        user_id: user?.id ? user.id : undefined,
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
    zValidator('json', AlertDtoSchema),
    async (c) => {
      const {
        name,
        strategy,
        wait,
        isPublic,
        description,
        languageCode,
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
        .insert(alerts)
        .values({
          active,
          description,
          isPublic,
          languageCode,
          name,
          promptId,
          strategy,
          threshold,
          userId: user.id,
          wait,
        })
        .returning()

      // Automatically create a subscription with default channel (email)
      await db.insert(subscriptions).values({
        alertId: inserted.id,
        channelId: null, // null means default email channel
        userId: user.id,
      })

      await track({
        channel: 'alerts',
        description: `Created alert: ${name} with default subscription`,
        event: 'Alert Created',
        icon: '✅',
        tags: {
          alert_id: inserted.id,
          alert_name: name,
          auto_subscribed: 'true',
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
    zValidator('json', AlertDtoSchema),
    async (c) => {
      const { id } = c.req.param()
      const request = await c.req.json()
      const user = c.get('user')

      if (!user) {
        await track({
          channel: 'alerts',
          description: 'User tried to update alert without authentication',
          event: 'Unauthorized Alert Update',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Check if alert exists and is not soft-deleted
      const existing = await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.id, id),
            eq(alerts.userId, user.id), // enforce ownership
            isNull(alerts.deletedAt),
          ),
        )
      if (existing.length === 0) {
        await track({
          channel: 'alerts',
          description: `Alert ${id} not found or already deleted`,
          event: 'Alert Update Failed',
          icon: '❌',
          tags: {
            alert_id: id,
            type: 'error',
          },
          user_id: user?.id ? user.id : undefined,
        })
        return c.json({ error: 'Alert not found' }, 404)
      }
      const result = await db
        .update(alerts)
        .set({ ...request, updatedAt: new Date() })
        .where(
          and(
            eq(alerts.id, id),
            eq(alerts.userId, user.id),
            isNull(alerts.deletedAt),
          ),
        )
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
        user_id: user?.id ? user.id : undefined,
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

      // Soft delete by setting deletedAt
      const result = await db
        .update(alerts)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(alerts.id, id),
            eq(alerts.userId, user.id),
            isNull(alerts.deletedAt),
          ),
        )
        .returning()

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
  .route('/test', TestAlertRouter)
