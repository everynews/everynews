import { db } from '@everynews/drizzle'
import { type Content, NewsSchema, news } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { trackEvent } from '@everynews/server/lib/logsnag'
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
      await trackEvent({
        channel: 'worker',
        event: 'Worker Job Started',
        description: 'Worker job execution started',
        icon: '🤖',
      })

      const found = await NewsSchema.array().parse(
        await db.query.news.findMany({
          where: and(eq(news.active, true), lt(news.nextRun, new Date())),
        }),
      )

      await trackEvent({
        channel: 'worker',
        event: 'News Items Found',
        description: `Found ${found.length} news items ready for processing`,
        icon: '📋',
        tags: {
          news_count: found.length,
        },
      })

      for (const item of found) {
        await trackEvent({
          channel: 'worker',
          event: 'Processing News Item',
          description: `Processing news item: ${item.name}`,
          icon: '⚙️',
          tags: {
            news_id: item.id,
            news_name: item.name,
            strategy_provider: item.strategy.provider,
          },
        })

        const urls = await curator(item)
        const contents: Content[] = await reaper(urls)
        const stories = await sage({contents, news: item})

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

        await trackEvent({
          channel: 'worker',
          event: 'News Item Processed',
          description: `Completed processing: ${item.name} - Found ${stories.length} stories`,
          icon: '✅',
          tags: {
            news_id: item.id,
            news_name: item.name,
            urls_found: urls.length,
            stories_created: stories.length,
            next_run: nextRun?.toISOString() || 'unknown',
            wait_type: item.wait.type,
          },
        })
      }

      await trackEvent({
        channel: 'worker',
        event: 'Worker Job Completed',
        description: `Worker job completed successfully - processed ${found.length} news items`,
        icon: '🎉',
        tags: {
          news_processed: found.length,
        },
      })

      return c.json({ ok: true })
    } catch (error) {
      await trackEvent({
        channel: 'worker',
        event: 'Worker Job Failed',
        description: `Worker job failed: ${String(error)}`,
        icon: '💥',
        tags: {
          error: String(error),
        },
      })
      throw error
    }
  },
)
