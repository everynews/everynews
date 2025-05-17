import { db } from '@everynews/drizzle'
import { news, subscriptions } from '@everynews/drizzle/service-schema'
import {
  SubscriptionDtoSchema,
  SubscriptionSchema,
} from '@everynews/schema/subscription'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'

export const SubscriptionRouter = new Hono<WithAuth>().use(authMiddleware).post(
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
    const { newsId, notificationChannelId } = await c.req.json()
    const user = c.get('user')
    if (!user?.id) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    if (!newsId || !notificationChannelId) {
      return c.json({ error: 'Missing newsId or notificationChannelId' }, 400)
    }
    const found = await db.query.news.findFirst({
      where: eq(news.id, newsId),
    })
    if (!found || (!found.isPublic && found.userId !== user.id)) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    return c.json(
      db
        .insert(subscriptions)
        .values({
          newsId,
          notificationChannelId,
          userId: user.id,
        })
        .execute(),
    )
  },
)
