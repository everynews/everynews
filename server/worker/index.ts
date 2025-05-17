import { db } from '@everynews/drizzle'
import { news } from '@everynews/schema'
import { NewsSchema } from '@everynews/schema/news'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'
import { and, eq, lt } from 'drizzle-orm'
import { z } from 'zod'

const StatusSchema = z.object({
  ok: z.boolean(),
})

export const WorkerRouter = new Hono<WithAuth>()
  .post(
    '/',
    describeRoute({
      description: 'Run Worker',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(StatusSchema),
            },
          },
          description: 'Run Worker',
        },
      },
    }),
    async (c) => {
      const found = await db.query.news.findMany({
        where: and(
          eq(news.active, true),
          lt(news.nextRun, new Date())
        ),
      })
      console.log(found)
      return c.json({ ok: true })
    },
  )
