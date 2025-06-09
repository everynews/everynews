import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import {
  type Content,
  NewsletterSchema,
  newsletter,
  subscriptions,
} from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'
import { curator } from '../subroutines/curator'
import { herald } from '../subroutines/herald'
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
        event: 'Worker Job Started',
        icon: '🤖',
        tags: {
          type: 'info',
        },
      })

      const found = NewsletterSchema.array().parse(
        await db.query.newsletter.findMany({
          where: and(
            eq(newsletter.active, true),
            lt(newsletter.nextRun, new Date()),
          ),
        }),
      )

      await track({
        channel: 'worker',
        event: `${found.length} Newsletters Found`,
        icon: '📋',
        tags: {
          newsletters_count: found.length,
          type: 'info',
        },
      })

      for (const item of found) {
        await track({
          channel: 'worker',
          event: `Processing Newsletter "${item.name}"`,
          icon: '⚙️',
          tags: {
            newsletter_id: item.id,
            newsletter_name: item.name,
            strategy_provider: item.strategy.provider,
            type: 'info',
          },
        })

        const urls = await curator(item)
        const contents: Content[] = await reaper(urls)
        const stories = await sage({ contents, news: item })

        let nextRun: Date | null = null
        if (item.wait.type === 'count') {
          nextRun = new Date(Date.now() + 60 * 60 * 1000)
          await db
            .update(newsletter)
            .set({ nextRun })
            .where(eq(newsletter.id, item.id))
        }
        if (item.wait.type === 'schedule') {
          nextRun = findNextRunDateBasedOnSchedule(item.wait.value)
          await db
            .update(newsletter)
            .set({ nextRun })
            .where(eq(newsletter.id, item.id))
        }

        // Send email to the all subscribers of the newsletter
        const subscribers = await db.query.subscriptions.findMany({
          where: eq(subscriptions.newsletterId, item.id),
        })

        for (const subscriber of subscribers) {
          await herald(subscriber.channelId, item.name, stories)
        }

        await track({
          channel: 'worker',
          description: `Completed processing: ${item.name} - Found ${stories.length} stories`,
          event: 'Newsletter Processed',
          icon: '✅',
          tags: {
            newsletter_id: item.id,
            newsletter_name: item.name,
            next_run: nextRun?.toISOString() || 'unknown',
            stories_created: stories.length,
            type: 'info',
            urls_found: urls.length,
            wait_type: item.wait.type,
          },
        })
      }

      await track({
        channel: 'worker',
        description: `Worker job completed successfully - processed ${found.length} newsletters`,
        event: 'Worker Job Completed',
        icon: '🎉',
        tags: {
          newsletters_processed: found.length,
          type: 'info',
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
          type: 'error',
        },
      })
      throw error
    }
  },
)
