import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { channels } from '@everynews/schema/channel'
import { StorySchema, stories } from '@everynews/schema/story'
import { subscriptions } from '@everynews/schema/subscription'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { herald } from '@everynews/subroutines/herald'
import { zValidator } from '@hono/zod-validator'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'

const TestAlertSchema = z.object({
  alertId: z.string(),
  channelId: z.string().nullable().optional(),
})

export const TestAlertRouter = new Hono<WithAuth>().use(authMiddleware).post(
  '/',
  describeRoute({
    description: 'Send a test alert notification',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: resolver(z.object({ success: z.boolean() })),
          },
        },
        description: 'Test alert sent successfully',
      },
      400: {
        content: {
          'application/json': {
            schema: resolver(z.object({ error: z.string() })),
          },
        },
        description: 'Bad request',
      },
      403: {
        content: {
          'application/json': {
            schema: resolver(z.object({ error: z.string() })),
          },
        },
        description: 'Forbidden',
      },
      500: {
        content: {
          'application/json': {
            schema: resolver(z.object({ error: z.string() })),
          },
        },
        description: 'Internal server error',
      },
    },
  }),
  zValidator('json', TestAlertSchema),
  async (c) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { alertId, channelId } = await c.req.json()

    try {
      // Fetch the alert
      const alert = AlertSchema.parse(
        await db.query.alerts.findFirst({
          where: and(eq(alerts.id, alertId), isNull(alerts.deletedAt)),
        }),
      )

      if (!alert) {
        return c.json({ error: 'Alert not found' }, 404)
      }

      // Check if user has access to this alert (owner or subscribed)
      const isOwner = alert.userId === user.id
      const subscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.alertId, alertId),
          eq(subscriptions.userId, user.id),
          isNull(subscriptions.deletedAt),
        ),
      })

      if (!isOwner && !subscription) {
        return c.json({ error: 'You do not have access to this alert' }, 403)
      }

      // If channelId is provided, verify the user owns it
      if (channelId) {
        const channel = await db.query.channels.findFirst({
          where: and(
            eq(channels.id, channelId),
            eq(channels.userId, user.id),
            isNull(channels.deletedAt),
          ),
        })

        if (!channel) {
          return c.json({ error: 'Channel not found or access denied' }, 404)
        }
      }

      await track({
        channel: 'alerts',
        description: `User requested test alert for "${alert.name}"`,
        event: 'Test Alert Requested',
        icon: '🧪',
        tags: {
          alert_id: alertId,
          channel_id: channelId || 'default',
          type: 'info',
        },
        user_id: user.id,
      })

      // Fetch the most recent stories for this alert
      const latestStories = StorySchema.array().parse(
        await db
          .select()
          .from(stories)
          .where(
            and(
              eq(stories.alertId, alertId),
              isNull(stories.deletedAt),
              eq(stories.systemMarkedIrrelevant, false),
              eq(stories.userMarkedIrrelevant, false),
            ),
          )
          .orderBy(desc(stories.createdAt))
          .limit(3),
      )

      if (latestStories.length === 0) {
        return c.json(
          {
            error:
              'No stories found for this alert. Please wait for the alert to run at least once.',
          },
          404,
        )
      }

      // Use the stories directly as they are already in the correct format
      const storiesToSend = latestStories

      // Get reader count for this alert
      const readerCount = await db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.alertId, alertId),
            isNull(subscriptions.deletedAt),
          ),
        )
        .then((res) => res[0]?.count || 0)

      // Send the test alert using herald
      await herald({
        alertName: `[TEST] ${alert.name}`,
        channelId,
        readerCount,
        stories: storiesToSend,
        strategy: alert.strategy,
        subscriptionId: subscription?.id,
        user: {
          email: user.email,
          id: user.id,
        },
        wait: alert.wait,
      })

      await track({
        channel: 'alerts',
        description: `Test alert sent successfully for "${alert.name}"`,
        event: 'Test Alert Sent',
        icon: '✅',
        tags: {
          alert_id: alertId,
          channel_id: channelId || 'default',
          stories_count: storiesToSend.length,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json({ success: true })
    } catch (error) {
      await track({
        channel: 'alerts',
        description: `Failed to send test alert: ${String(error)}`,
        event: 'Test Alert Failed',
        icon: '❌',
        tags: {
          alert_id: alertId,
          channel_id: channelId || 'default',
          error: String(error),
          type: 'error',
        },
        user_id: user.id,
      })

      return c.json({ error: 'Failed to send test alert' }, 500)
    }
  },
)
