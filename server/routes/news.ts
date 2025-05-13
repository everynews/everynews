import { db } from '@everynews/drizzle'
import { news } from '@everynews/drizzle/service-schema'
import { newsCreateSchema } from '@everynews/drizzle/types'
import { updateNewsDtoSchema } from '@everynews/dto/news/update'
import { redactError } from '@everynews/lib/error'
import { nanoid } from '@everynews/lib/id'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { WithAuth } from '../bindings/auth'

export const newsHono = new Hono<WithAuth>()
  .get('/', async (c) => {
    try {
      const contents = await db.query.news.findMany({
        orderBy: (news, { desc }) => [desc(news.createdAt)],
      })
      return c.json({ data: contents, error: null }, 200)
    } catch (error) {
      return c.json(
        {
          data: null,
          error: redactError({
            error: error as Error,
            safeAlternateString: 'Internal Server Error',
          }),
          message: 'News Read Failed',
        },
        500,
      )
    }
  })

  .get('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const content = await db.query.news.findFirst({
        where: eq(news.id, id),
      })

      if (!content) {
        return c.json(
          {
            data: null,
            error: redactError({
              error: new Error('News Not Found'),
              safeAlternateString: 'News Not Found',
            }),
            message: 'News Not Found',
          },
          404,
        )
      }

      return c.json(
        { data: content, error: null, message: 'News Retrieved' },
        200,
      )
    } catch (error) {
      return c.json(
        {
          data: null,
          error: redactError({
            error: error as Error,
            safeAlternateString: 'Internal Server Error',
          }),
          message: 'News Read Failed',
        },
        500,
      )
    }
  })

  .post('/', zValidator('json', newsCreateSchema), async (c) => {
    try {
      const data = await c.req.json()
      const user = c.get('user')
      const now = new Date()
      const content = {
        ...data,
        createdAt: now,
        id: nanoid(),
        userId: user?.id,
      }

      await db.insert(news).values(content)
      return c.json(
        {
          data: content,
          error: null,
          message: 'News Created',
        },
        201,
      )
    } catch (error) {
      return c.json(
        {
          data: null,
          error: redactError({
            error: error as Error,
            safeAlternateString: 'Internal Server Error',
          }),
          message: 'News Create Failed',
        },
        500,
      )
    }
  })

  .put('/:id', zValidator('json', updateNewsDtoSchema), async (c) => {
    try {
      const id = c.req.param('id')
      const data = await c.req.json()

      const existingContent = await db.query.news.findFirst({
        where: eq(news.id, id),
      })

      if (!existingContent) {
        return c.json(
          {
            data: null,
            error: redactError({
              error: new Error('News Not Found'),
              safeAlternateString: 'News Not Found',
            }),
            message: 'News Not Found',
          },
          404,
        )
      }

      const updatedContent = {
        ...data,
        updatedAt: new Date(),
      }

      await db.update(news).set(updatedContent).where(eq(news.id, id))

      return c.json(
        {
          data: updatedContent,
          error: null,
          message: 'News Updated',
        },
        200,
      )
    } catch (error) {
      return c.json(
        {
          data: null,
          error: redactError({
            error: error as Error,
            safeAlternateString: 'Internal Server Error',
          }),
          message: 'News Update Failed',
        },
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
        return c.json(
          {
            data: null,
            error: redactError({
              error: new Error('News to Delete Not Found'),
              safeAlternateString: 'News to Delete Not Found',
            }),
            message: 'News to Delete Not Found',
          },
          404,
        )
      }

      await db.delete(news).where(eq(news.id, id))
      return c.json(
        {
          data: null,
          error: null,
          message: 'News Deleted',
        },
        200,
      )
    } catch (error) {
      return c.json(
        {
          data: null,
          error: redactError({
            error: error as Error,
            safeAlternateString: 'Internal Server Error',
          }),
          message: 'News Delete Failed',
        },
        500,
      )
    }
  })

export type NewsAppType = typeof newsHono
