import { db } from '@everynews/drizzle'
import { NewsSchema, news } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'
import { CuratorService } from '../services/curator.service'

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
    const found = await NewsSchema.array().parse(
      await db.query.news.findMany({
        where: and(eq(news.active, true), lt(news.nextRun, new Date())),
      }),
    )
    for (const newsItem of found) {
      await CuratorService.get().enqueue(newsItem)
    }
    return c.json({ ok: true })
  },
)
