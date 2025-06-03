import { db } from '@everynews/drizzle'
import { nanoid } from '@everynews/lib/id'
import { news } from '@everynews/schema'
import { NewsDtoSchema, NewsSchema } from '@everynews/schema/news'
import { track } from '@everynews/logs'
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
              schema: resolver(NewsSchema.array()),
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
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db.select().from(news).execute()

      await track({
        channel: 'news',
        description: `Retrieved ${result.length} news items`,
        event: 'News List Retrieved',
        icon: '📰',
        tags: {
          count: result.length,
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
              schema: resolver(NewsSchema),
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
        .from(news)
        .where(eq(news.id, id))
        .execute()

      await track({
        channel: 'news',
        description: `Retrieved news item: ${id}`,
        event: 'News Item Retrieved',
        icon: '📰',
        tags: {
          found: String(result.length > 0),
          news_id: id,
        },
      })

      return c.json(result)
    },
  )
  .post(
    '/',
    describeRoute({
      description: 'Create News',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsSchema),
            },
          },
          description: 'Create News',
        },
      },
    }),
    validator('json', NewsDtoSchema),
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
        .insert(news)
        .values({
          id: newsId,
          isPublic,
          name,
          strategy,
          userId: user.id,
          wait,
        })
        .execute()

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
              schema: resolver(NewsSchema),
            },
          },
          description: 'Delete News by ID',
        },
      },
    }),
    validator('json', NewsDtoSchema),
    async (c) => {
      const { id } = c.req.param()

      const result = await db.delete(news).where(eq(news.id, id)).execute()

      await track({
        channel: 'news',
        description: `Deleted news item: ${id}`,
        event: 'News Deleted',
        icon: '🗑️',
        tags: {
          news_id: id,
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
              schema: resolver(NewsSchema),
            },
          },
          description: 'Update News by ID',
        },
      },
    }),
    validator('json', NewsDtoSchema),
    async (c) => {
      const { id } = c.req.param()
      const request = await c.req.json()

      const result = await db
        .update(news)
        .set({ ...request })
        .where(eq(news.id, id))
        .execute()

      await track({
        channel: 'news',
        description: `Updated news item: ${id}`,
        event: 'News Updated',
        icon: '✏️',
        tags: {
          fields_updated: Object.keys(request).join(', '),
          news_id: id,
        },
      })

      return c.json(result)
    },
  )
