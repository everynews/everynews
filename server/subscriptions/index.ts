import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { newsletter, subscriptions } from '@everynews/schema'
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
      const { newsletterId, channelId } = await c.req.json()
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
      if (!newsletterId || !channelId) {
        await track({
          channel: 'subscriptions',
          description:
            'Missing newsletterId or channelId in subscription request',
          event: 'Invalid Subscription Request',
          icon: '⚠️',
          tags: {
            has_channel_id: String(!!channelId),
            has_newsletter_id: String(!!newsletterId),
            type: 'error',
          },
          user_id: user.id,
        })
        return c.json({ error: 'Missing newsletterId or channelId' }, 400)
      }
      const found = await db.query.newsletter.findFirst({
        where: eq(newsletter.id, newsletterId),
      })
      if (!found || (!found.isPublic && found.userId !== user.id)) {
        await track({
          channel: 'subscriptions',
          description: `User tried to subscribe to inaccessible news: ${newsletterId}`,
          event: 'Forbidden Subscription',
          icon: '🔒',
          tags: {
            channel_id: channelId,
            news_exists: String(!!found),
            news_is_public: String(found?.isPublic || false),
            newsletter_id: newsletterId,
            type: 'error',
            user_owns_news: String(found?.userId === user.id),
          },
          user_id: user.id,
        })
        return c.json({ error: 'Forbidden' }, 403)
      }

      const result = await db
        .insert(subscriptions)
        .values({
          channelId,
          newsletterId,
          userId: user.id,
        })
        .returning()

      await track({
        channel: 'subscriptions',
        description: `User subscribed to news: ${found.name}`,
        event: 'Subscription Created',
        icon: '✅',
        tags: {
          channel_id: channelId,
          news_name: found.name,
          newsletter_id: newsletterId,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
