import { db } from '@everynews/drizzle'
import { news } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'

export const WorkerRouter = new Hono<WithAuth>().post(
  '/',
  describeRoute({
    description: 'Run Worker',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: resolver(WorkerStatusSchema),
          },
        },
        description: 'Run Worker',
      },
    },
  }),
  async (c) => {
    const found = await db.query.news.findMany({
      where: and(eq(news.active, true), lt(news.nextRun, new Date())),
    })
    console.log(found)
    return c.json({ ok: true })
  },
)
