import { db } from '@everynews/drizzle'
import { type ContentDto, NewsSchema, StoryDto, contents, news } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'
import { curator } from '../subroutines/curator'
import { reaper } from '../subroutines/reaper'
import { sage } from '../subroutines/sage'

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
    const stories: StoryDto[] = []
    for (const newsItem of found) {
      const urls = await curator(newsItem)
      const content: ContentDto[] = await reaper(urls)
      const stories = await sage(content)
      stories.push(...stories)
    }
    return c.json({ stories })
  },
)
