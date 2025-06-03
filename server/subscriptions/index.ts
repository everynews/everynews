import { db } from '@everynews/drizzle'
import { track } from '@everynews/logs'
import { news, subscriptions } from '@everynews/schema'
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
      const { newsId, channelId } = await c.req.json()
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
      if (!newsId || !channelId) {
        await track({
          channel: 'subscriptions',
          description: 'Missing newsId or channelId in subscription request',
          event: 'Invalid Subscription Request',
          icon: '⚠️',
          tags: {
            has_channel_id: String(!!channelId),
            has_news_id: String(!!newsId),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.json({ error: 'Missing newsId or channelId' }, 400)
      }
      const found = await db.query.news.findFirst({
        where: eq(news.id, newsId),
      })
      if (!found || (!found.isPublic && found.userId !== user.id)) {
        await track({
          channel: 'subscriptions',
          description: `User tried to subscribe to inaccessible news: ${newsId}`,
          event: 'Forbidden Subscription',
          icon: '🔒',
          tags: {
            channel_id: channelId,
            news_exists: String(!!found),
            news_id: newsId,
            news_is_public: String(found?.isPublic || false),
            user_owns_news: String(found?.userId === user.id),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.json({ error: 'Forbidden' }, 403)
      }

      const result = await db
        .insert(subscriptions)
        .values({
          channelId,
          newsId,
          userId: user.id,
        })
        .execute()

      await track({
        channel: 'subscriptions',
        description: `User subscribed to news: ${found.name}`,
        event: 'Subscription Created',
        icon: '✅',
        tags: {
          channel_id: channelId,
          news_id: newsId,
          news_name: found.name,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
