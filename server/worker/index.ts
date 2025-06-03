import { db } from '@everynews/drizzle'
import { type ContentDto, NewsSchema, news } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'
import { curator } from '../subroutines/curator'
import { reaper } from '../subroutines/reaper'
import { sage } from '../subroutines/sage'

const findNextRunDateBasedOnSchedule = (schedule: string) => {
  const { days, hours } =
    typeof schedule === 'string' ? JSON.parse(schedule) : schedule
  const sortedHours = [...hours].sort((a, b) => a - b)
  const now = new Date()

  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + offset)
    const dayName = candidate.toLocaleString('en-us', { weekday: 'long' })
    if (!days.includes(dayName)) continue

    for (const h of sortedHours) {
      candidate.setHours(h, 0, 0, 0)
      if (candidate > now) return candidate
    }
  }

  return null // no future run within one week
}

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
    for (const item of found) {
      const urls = await curator(item)
      const content: ContentDto[] = await reaper(urls)
      const stories = await sage(content)
      if (item.wait.type === 'count') {
        await db
          .update(news)
          .set({ nextRun: new Date(Date.now() + 60 * 60 * 1000) })
          .where(eq(news.id, item.id))
          .execute()
      }
      if (item.wait.type === 'schedule') {
        await db
          .update(news)
          .set({ nextRun: findNextRunDateBasedOnSchedule(item.wait.value) })
          .where(eq(news.id, item.id))
          .execute()
      }
    }
    return c.json({ ok: true })
  },
)
