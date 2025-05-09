import { db } from '@everynews/drizzle'
import { news } from '@everynews/drizzle/service-schema'
import { nanoid } from '@everynews/lib/id'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

const createNewsSchema = z.object({
  isActive: z.boolean(),
  name: z.string(),
  strategy: z.object({
    filters: z.object({
      provider: z.string(),
      query: z.string(),
    }),
  }),
  waitSettings: z.object({
    timeSettings: z.object({
      sendAt: z.string(),
      timezone: z.string(),
    }),
    type: z.string(),
  }),
})

const editNewsSchema = createNewsSchema.partial()

export const newsHono = new Hono()
  .get('/', async (c) => {
    try {
      const contents = await db.query.news.findMany({
        orderBy: (news, { desc }) => [desc(news.createdAt)],
      })
      return c.json({ data: contents, error: null }, 200)
    } catch (error) {
      return c.json({ data: null, error: error }, 500)
    }
  })

  .get('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const content = await db.query.news.findFirst({
        where: eq(news.id, id),
      })

      if (!content) {
        return c.json({ data: null, error: 'News item not found' }, 404)
      }

      return c.json({ data: content, error: null }, 200)
    } catch (error) {
      return c.json({ data: null, error: error }, 500)
    }
  })

  .post('/', zValidator('json', createNewsSchema), async (c) => {
    try {
      const data = c.req.valid('json')
      const now = new Date()

      const content = {
        createdAt: now,
        id: nanoid(),
        isActive: data.isActive,
        lastRun: null,
        lastSent: null,
        name: data.name,
        nextRun: null,
        strategy: data.strategy,
        updatedAt: now,
        waitSettings: data.waitSettings,
      }

      await db.insert(news).values(content)
      return c.json(
        {
          data: content,
          error: null,
          message: 'News item created successfully',
        },
        201,
      )
    } catch (error) {
      return c.json(
        { data: null, error, message: 'Failed to create news item' },
        500,
      )
    }
  })

  .put('/:id', zValidator('json', editNewsSchema), async (c) => {
    try {
      const id = c.req.param('id')
      const data = c.req.valid('json')

      const existingContent = await db.query.news.findFirst({
        where: eq(news.id, id),
      })

      if (!existingContent) {
        return c.json({ error: 'News item not found' }, 404)
      }

      const updatedContent = {
        isActive: data.isActive,
        name: data.name,
        strategy: data.strategy,
        updatedAt: new Date(),
        waitSettings: data.waitSettings,
      }

      await db.update(news).set(updatedContent).where(eq(news.id, id))

      return c.json(
        {
          data: updatedContent,
          error: null,
          message: 'News item updated successfully',
        },
        200,
      )
    } catch (error) {
      return c.json(
        { data: null, error, message: 'Failed to update news item' },
        500,
      )
    }
  })

  .delete('/:id', async (c) => {
    try {
      const id = c.req.param('id')

      const existingNews = await db.query.news.findFirst({
        where: eq(news.id, id),
      })

      if (!existingNews) {
        return c.json({ error: 'News item not found' }, 404)
      }

      await db.delete(news).where(eq(news.id, id))
      return c.json(
        {
          error: null,
          message: 'News item deleted successfully',
        },
        200,
      )
    } catch (error) {
      return c.json({ error, message: 'Failed to delete news item' }, 500)
    }
  })

export type NewsAppType = typeof newsHono
