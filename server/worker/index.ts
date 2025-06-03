import { db } from '@everynews/drizzle'
import { type Content, NewsSchema, news } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { track } from '@everynews/logs'
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

  return null
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
    try {
      await track({
        channel: 'worker',
        description: 'Worker job execution started',
        event: 'Worker Job Started',
        icon: '🤖',
      })

      const found = await NewsSchema.array().parse(
        await db.query.news.findMany({
          where: and(eq(news.active, true), lt(news.nextRun, new Date())),
        }),
      )

      await track({
        channel: 'worker',
        description: `Found ${found.length} news items ready for processing`,
        event: 'News Items Found',
        icon: '📋',
        tags: {
          news_count: found.length,
        },
      })

      for (const item of found) {
        await track({
          channel: 'worker',
          description: `Processing news item: ${item.name}`,
          event: 'Processing News Item',
          icon: '⚙️',
          tags: {
            news_id: item.id,
            news_name: item.name,
            strategy_provider: item.strategy.provider,
          },
        })

        const urls = await curator(item)
        const contents: Content[] = await reaper(urls)
        const stories = await sage({ contents, news: item })

        let nextRun: Date | null = null
        if (item.wait.type === 'count') {
          nextRun = new Date(Date.now() + 60 * 60 * 1000)
          await db
            .update(news)
            .set({ nextRun })
            .where(eq(news.id, item.id))
            .execute()
        }
        if (item.wait.type === 'schedule') {
          nextRun = findNextRunDateBasedOnSchedule(item.wait.value)
          await db
            .update(news)
            .set({ nextRun })
            .where(eq(news.id, item.id))
            .execute()
        }

        await track({
          channel: 'worker',
          description: `Completed processing: ${item.name} - Found ${stories.length} stories`,
          event: 'News Item Processed',
          icon: '✅',
          tags: {
            news_id: item.id,
            news_name: item.name,
            next_run: nextRun?.toISOString() || 'unknown',
            stories_created: stories.length,
            urls_found: urls.length,
            wait_type: item.wait.type,
          },
        })
      }

      await track({
        channel: 'worker',
        description: `Worker job completed successfully - processed ${found.length} news items`,
        event: 'Worker Job Completed',
        icon: '🎉',
        tags: {
          news_processed: found.length,
        },
      })

      return c.json({ ok: true })
    } catch (error) {
      await track({
        channel: 'worker',
        description: `Worker job failed: ${String(error)}`,
        event: 'Worker Job Failed',
        icon: '💥',
        tags: {
          error: String(error),
        },
      })
      throw error
    }
  },
)
