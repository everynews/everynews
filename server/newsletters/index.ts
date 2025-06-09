import { db } from '@everynews/drizzle'
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

export const NewsletterRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/',
    describeRoute({
      description: 'Get All Newsletters',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema.array()),
            },
          },
          description: 'Get All Newsletters',
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
        description: `Retrieved ${result.length} newsletter items`,
        event: 'Newsletter List Retrieved',
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
      description: 'Get Newsletter by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema),
            },
          },
          description: 'Get Newsletter by ID',
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
        description: `Retrieved Newsleter ${id}`,
        event: 'Newsletter Item Retrieved',
        icon: '📰',
        tags: {
          found: String(result.length > 0),
          newsletter_id: id,
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

      const [inserted] = await db
        .insert(newsletter)
        .values({
          isPublic,
          name,
          strategy,
          userId: user.id,
          wait,
        })
        .returning()

      await track({
        channel: 'news',
        description: `Created newsletter: ${name}`,
        event: 'Newsletter Created',
        icon: '✅',
        tags: {
          is_public: isPublic,
          news_name: name,
          newsletter_id: inserted.id,
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
      description: 'Update Newsletter by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema),
            },
          },
          description: 'Update Newsletter by ID',
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
        description: `Updated Newsleter ${id}`,
        event: 'Newsletter Updated',
        icon: '✏️',
        tags: {
          fields_updated: Object.keys(request).join(', '),
          newsletter_id: id,
          type: 'info',
        },
      })

      return c.json(result)
    },
  )
  .delete(
    '/:id',
    describeRoute({
      description: 'Delete Newsletter by ID',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(NewsletterSchema),
            },
          },
          description: 'Delete Newsletter by ID',
        },
      },
    }),
    async (c) => {
      const { id } = c.req.param()
      const user = c.get('user')

      if (!user) {
        await track({
          channel: 'news',
          description: 'User tried to delete newsletter without authentication',
          event: 'Unauthorized Newsletter Deletion',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      const result = await db
        .delete(newsletter)
        .where(eq(newsletter.id, id))
        .returning()

      await track({
        channel: 'news',
        description: `Deleted Newsletter ${id}`,
        event: 'Newsletter Deleted',
        icon: '🗑️',
        tags: {
          newsletter_id: id,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(result)
    },
  )
