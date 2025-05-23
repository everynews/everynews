import { db } from '@everynews/drizzle'
import { news, type Strategy } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { runStrategy } from '@everynews/worker'
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
    for (const news of found) {
      const parsedItems = await runStrategy(news.strategy as Strategy)
      // Do something
    }
    return c.json({ ok: true })
  },
)
