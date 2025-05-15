import { db } from '@everynews/drizzle'
import { news } from '@everynews/drizzle/service-schema'
import { nanoid } from '@everynews/lib/id'
import { NewsDtoSchema, NewsSchema } from '@everynews/schema/news'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'

export const newsHono = new Hono<WithAuth>()
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
        return c.json({ error: 'Unauthorized' }, 401)
      }
      return c.json(await db.select().from(news).execute())
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
    (c) => {
      const { id } = c.req.param()
      return c.json(db.select().from(news).where(eq(news.id, id)).execute())
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
        return c.json({ error: 'Unauthorized' }, 401)
      }
      const inserted = await db.insert(news).values({
        id: nanoid(),
        isPublic,
        name,
        strategy,
        userId: user.id,
        wait,
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
    (c) => {
      const { id } = c.req.param()
      return c.json(db.delete(news).where(eq(news.id, id)))
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
      return c.json(
        db
          .update(news)
          .set({ ...request })
          .where(eq(news.id, id)),
      )
    },
  )
