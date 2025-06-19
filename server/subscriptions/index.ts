import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { alert, subscriptions } from '@everynews/schema'
import {
  SubscriptionDtoSchema,
  SubscriptionSchema,
} from '@everynews/schema/subscription'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { z } from 'zod'

export const SubscriptionRouter = new Hono<WithAuth>()
  .use(authMiddleware)

  .post(
    '/',
    describeRoute({
      description: 'Subscribe to News',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(SubscriptionSchema),
            },
          },
          description: 'Subscribe to News',
        },
      },
    }),

    validator('json', SubscriptionDtoSchema),

    async (c) => {
      const { alertId, channelId, userId } = await c.req.json()
      const user = c.get('user')
      if (!user?.id) {
        await track({
          channel: 'subscriptions',
          description: 'User tried to subscribe without authentication',
          event: 'Unauthorized Subscription',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'User not authenticated' }, 401)
      }
      if (!alertId) {
        await track({
          channel: 'subscriptions',
          description: 'Missing alertId in subscription request',
          event: 'Invalid Subscription Request',
          icon: '⚠️',
          tags: {
            has_alert_id: String(!!alertId),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.json({ error: 'Missing alertId' }, 400)
      }
      const found = await db.query.alert.findFirst({
        where: and(eq(alert.id, alertId), isNull(alert.deletedAt)),
      })
      if (!found || (!found.isPublic && found.userId !== user.id)) {
        await track({
          channel: 'subscriptions',
          description: `User tried to subscribe to inaccessible alert: ${alertId}`,
          event: 'Forbidden Subscription',
          icon: '🔒',
          tags: {
            alert_exists: String(!!found),
            alert_id: alertId,
            alert_is_public: String(found?.isPublic || false),
            channel_id: channelId,
            type: 'error',
            user_owns_alert: String(found?.userId === user.id),
          },
          user_id: user.id,
        })
        return c.json({ error: 'Forbidden' }, 403)
      }

      const result = await db
        .insert(subscriptions)
        .values({
          alertId,
          channelId: channelId ?? null,
          userId: userId ?? user.id,
        })
        .returning()

      await track({
        channel: 'subscriptions',
        description: `User subscribed to alert: ${found.name}${channelId ? '' : ' (default channel)'}`,
        event: 'Subscription Created',
        icon: '✅',
        tags: {
          alert_id: alertId,
          alert_name: found.name,
          channel_id: channelId || 'default',
          type: 'info',
        },
        user_id: userId ?? user.id,
      })

      return c.json(result)
    },
  )

  .delete(
    '/:id',
    describeRoute({
      description: 'Unsubscribe from News',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
          description: 'Successfully unsubscribed',
        },
      },
    }),

    async (c) => {
      const subscriptionId = c.req.param('id')
      const user = c.get('user')

      if (!user?.id) {
        await track({
          channel: 'subscriptions',
          description: 'User tried to unsubscribe without authentication',
          event: 'Unauthorized Unsubscription',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'User not authenticated' }, 401)
      }

      const subscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.id, subscriptionId),
          isNull(subscriptions.deletedAt),
        ),
      })

      if (!subscription || subscription.userId !== user.id) {
        await track({
          channel: 'subscriptions',
          description: `User tried to delete inaccessible subscription: ${subscriptionId}`,
          event: 'Forbidden Unsubscription',
          icon: '🔒',
          tags: {
            subscription_exists: String(!!subscription),
            subscription_id: subscriptionId,
            type: 'error',
            user_owns_subscription: String(subscription?.userId === user.id),
          },
          user_id: user.id,
        })
        return c.json({ error: 'Forbidden' }, 403)
      }

      // Soft delete by setting deletedAt
      await db
        .update(subscriptions)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(subscriptions.id, subscriptionId),
            isNull(subscriptions.deletedAt),
          ),
        )

      await track({
        channel: 'subscriptions',
        description: `User unsubscribed from subscription: ${subscriptionId}`,
        event: 'Subscription Deleted',
        icon: '❌',
        tags: {
          subscription_id: subscriptionId,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json({ message: 'Successfully unsubscribed' })
    },
  )
