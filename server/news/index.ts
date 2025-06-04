import { db } from '@everynews/drizzle'
import { nanoid } from '@everynews/lib/id'
import { track } from '@everynews/logs'
import { newsletter } from '@everynews/schema'
import {
  NewsletterDtoSchema,
  NewsletterSchema,
} from '@everynews/schema/newsletter'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'

export const NewsRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/',
    describeRoute({
      description: 'Get All News',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema.array()),
            },
          },
          description: 'Get All News',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'news',
          description: 'User tried to access news without authentication',
          event: 'Unauthorized Access',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db.select().from(newsletter)

      await track({
        channel: 'news',
        description: `Retrieved ${result.length} news items`,
        event: 'News List Retrieved',
        icon: '📰',
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
      description: 'Get News by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema),
            },
          },
          description: 'Get News by ID',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()

      const result = await db
        .select()
        .from(newsletter)
        .where(eq(newsletter.id, id))

      await track({
        channel: 'news',
        description: `Retrieved news item: ${id}`,
        event: 'News Item Retrieved',
        icon: '📰',
        tags: {
          found: String(result.length > 0),
          news_id: id,
          type: 'info',
        },
      })

      return c.json(result)
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Create Newsletter',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema),
            },
          },
          description: 'Create Newsletter',
        },
      },
    }),
    validator('json', NewsletterDtoSchema),
    async (c) => {
      const { name, strategy, wait, isPublic } = await c.req.json()
      const user = c.get('user')
      if (!user) {
        await track({
          channel: 'news',
          description: 'User tried to create news without authentication',
          event: 'Unauthorized News Creation',
          icon: '🚫',
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const newsId = nanoid()
      const inserted = await db
        .insert(newsletter)
        .values({
          id: newsId,
          isPublic,
          name,
          strategy,
          userId: user.id,
          wait,
        })
        .returning()

      await track({
        channel: 'news',
        description: `Created news: ${name}`,
        event: 'News Created',
        icon: '✅',
        tags: {
          is_public: isPublic,
          news_id: newsId,
          news_name: name,
          strategy_provider: strategy.provider,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(inserted)
    },
  )
  .delete(
    '/:id',
    describeRoute({
      description: 'Delete News by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema),
            },
          },
          description: 'Delete News by ID',
        },
      },
    }),
    validator('json', NewsletterDtoSchema),
    async (c) => {
      const { id } = c.req.param()

      const result = await db
        .delete(newsletter)
        .where(eq(newsletter.id, id))
        .returning()

      await track({
        channel: 'news',
        description: `Deleted news item: ${id}`,
        event: 'News Deleted',
        icon: '🗑️',
        tags: {
          news_id: id,
          type: 'info',
        },
      })

      return c.json(result)
    },
  )
  .put(
    '/:id',
    describeRoute({
      description: 'Update News by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema),
            },
          },
          description: 'Update News by ID',
        },
      },
    }),
    validator('json', NewsletterDtoSchema),
    async (c) => {
      const { id } = c.req.param()
      const request = await c.req.json()

      const result = await db
        .update(newsletter)
        .set({ ...request })
        .where(eq(newsletter.id, id))
        .returning()

      await track({
        channel: 'news',
        description: `Updated news item: ${id}`,
        event: 'News Updated',
        icon: '✏️',
        tags: {
          fields_updated: Object.keys(request).join(', '),
          news_id: id,
          type: 'info',
        },
      })

      return c.json(result)
    },
  )
