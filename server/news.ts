import { db } from '@everynews/drizzle'
import { news } from '@everynews/drizzle/service-schema'
import { newsArraySchema, newsSchema } from '@everynews/drizzle/types'
import { nanoid } from '@everynews/lib/id'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

export const newsHono = new Hono()
  .get('/', async (c) => {
    try {
      const newsItems = await db.query.news.findMany({
        orderBy: (news, { desc }) => [desc(news.createdAt)],
      })
      return c.json({ news: newsArraySchema.parse(newsItems) }, 200)
    } catch (error) {
      return c.json({ error: 'Failed to fetch news items' }, 500)
    }
  })

  .get('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const newsItem = await db.query.news.findFirst({
        where: eq(news.id, id),
      })

      if (!newsItem) {
        return c.json({ error: 'News item not found' }, 404)
      }

      return c.json({ news: newsSchema.parse(newsItem) }, 200)
    } catch (error) {
      return c.json({ error: 'Failed to fetch news item' }, 500)
    }
  })

  .post('/', zValidator('json', newsSchema), async (c) => {
    try {
      const data = c.req.valid('json')
      const now = new Date()

      const newsItem = {
        createdAt: now,
        id: nanoid(),
        isActive: data.isActive,
        // These can be null initially
        lastRun: null,
        lastSent: null,
        name: data.name,
        nextRun: null,
        relevanceSettings: data.relevanceSettings,
        searchQuery: data.searchQuery,
        updatedAt: now,
        waitSettings: data.waitSettings,
      }

      await db.insert(news).values(newsItem)
      return c.json(
        {
          message: 'News item created successfully',
          news: newsSchema.parse(newsItem),
        },
        201,
      )
    } catch (error) {
      return c.json({ error: 'Failed to create news item' }, 500)
    }
  })

  .put('/:id', zValidator('json', newsSchema), async (c) => {
    try {
      const id = c.req.param('id')
      const data = c.req.valid('json')

      const existingNews = await db.query.news.findFirst({
        where: eq(news.id, id),
      })

      if (!existingNews) {
        return c.json({ error: 'News item not found' }, 404)
      }

      const updatedNewsItem = {
        isActive: data.isActive,
        name: data.name,
        relevanceSettings: data.relevanceSettings,
        searchQuery: data.searchQuery,
        updatedAt: new Date(),
        waitSettings: data.waitSettings,
      }

      await db.update(news).set(updatedNewsItem).where(eq(news.id, id))

      return c.json(
        {
          message: 'News item updated successfully',
          news: newsSchema.parse({ ...existingNews, ...updatedNewsItem }),
        },
        200,
      )
    } catch (error) {
      return c.json({ error: 'Failed to update news item' }, 500)
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
      return c.json({ message: 'News item deleted successfully' }, 200)
    } catch (error) {
      return c.json({ error: 'Failed to delete news item' }, 500)
    }
  })

export type NewsAppType = typeof newsHono
