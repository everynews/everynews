import crypto from 'node:crypto'
import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import {
  AlertSchema,
  alert,
  type Content,
  subscriptions,
  users,
} from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, asc, eq, lt } from 'drizzle-orm'
import { type Context, Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { curator } from '../subroutines/curator'
import { custodian } from '../subroutines/custodian'
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

const validateCronJob = async (c: Context): Promise<boolean> => {
  // Only allow requests from Vercel cron jobs - block all user access
  const authHeader = c.req.header('Authorization')
  const cronSecret = process.env.CRON_SECRET
  const isDev = process.env.NODE_ENV === 'development'

  if (!cronSecret && !isDev) {
    await track({
      channel: 'cron',
      event: 'Cron Secret Not Configured',
      icon: '⚠️',
      tags: {
        ip: c.req.header('x-forwarded-for') || 'unknown',
        type: 'error',
      },
    })
    return false
  }

  if (!authHeader && !isDev) {
    await track({
      channel: 'cron',
      event: 'Unauthorized Cron Access - Missing Authorization',
      icon: '🚫',
      tags: {
        ip: c.req.header('x-forwarded-for') || 'unknown',
        type: 'error',
      },
    })
    return false
  }

  const expectedHeader = `Bearer ${cronSecret}`
  let isValidCronJob = false

  try {
    // Use timing-safe comparison to prevent timing attacks
    isValidCronJob = crypto.timingSafeEqual(
      Buffer.from(authHeader || '', 'utf8'),
      Buffer.from(expectedHeader, 'utf8'),
    )
  } catch {
    // If lengths don't match, timingSafeEqual throws
    isValidCronJob = false
  }

  if (!isValidCronJob && !isDev) {
    await track({
      channel: 'cron',
      event: 'Unauthorized Cron Access - Invalid Secret',
      icon: '🚫',
      tags: {
        ip: c.req.header('x-forwarded-for') || 'unknown',
        type: 'error',
      },
    })
    return false
  }

  // Valid cron job authenticated
  await track({
    channel: 'cron',
    event: 'Cron Job Authenticated',
    icon: '⏰',
    tags: {
      source: 'vercel-cron',
      timestamp: new Date().toISOString(),
      type: 'info',
    },
  })

  return true
}

export const CronRouter = new Hono().get(
  '/',
  describeRoute({
    description: 'Run Cron Job - Alert Processing',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: resolver(WorkerStatusSchema),
          },
        },
        description: 'Cron Job Execution Result',
      },
      401: {
        content: {
          'application/json': {
            schema: {
              properties: {
                error: { type: 'string' },
              },
              type: 'object',
            },
          },
        },
        description: 'Unauthorized',
      },
      503: {
        content: {
          'application/json': {
            schema: {
              properties: {
                error: { type: 'string' },
              },
              type: 'object',
            },
          },
        },
        description: 'Service Unavailable',
      },
    },
  }),
  async (c) => {
    const isValid = await validateCronJob(c)

    if (!isValid) {
      return c.json({ error: 'Unauthorized - Invalid cron job' }, 401)
    }
    try {
      // At this point, we know it's a valid cron job (middleware verified)
      await track({
        channel: 'cron',
        event: 'Alert Processing Started',
        icon: '🤖',
        tags: {
          timestamp: new Date().toISOString(),
          triggered_by: 'cron',
          type: 'info',
        },
      })

      const found = AlertSchema.array().parse(
        await db.query.alert.findMany({
          orderBy: asc(alert.lastRun),
          where: and(eq(alert.active, true), lt(alert.nextRun, new Date())),
        }),
      )

      await track({
        channel: 'worker',
        event: `${found.length} Alerts Found`,
        icon: '📋',
        tags: {
          alerts_count: found.length,
          type: 'info',
        },
      })

      for (const item of found) {
        await track({
          channel: 'worker',
          event: `Processing Alert "${item.name}"`,
          icon: '⚙️',
          tags: {
            alert_id: item.id,
            alert_name: item.name,
            strategy_provider: item.strategy.provider,
            type: 'info',
          },
        })

        const urls = await curator(item)
        const contents: Content[] = await reaper(urls)
        const stories = await sage({ contents, news: item })

        // Filter stories to only include those created since lastRun and not marked as irrelevant
        const filteredStories = stories.filter((story) => {
          // Filter out both user-marked and system-marked irrelevant stories
          if (story.userMarkedIrrelevant || story.systemMarkedIrrelevant) {
            return false
          }
          if (!item.lastRun) return true // If no lastRun, include all stories
          return story.createdAt > item.lastRun
        })

        await track({
          channel: 'worker',
          description: `Filtered ${filteredStories.length}/${stories.length} stories created since last run`,
          event: 'Stories Filtered by lastRun',
          icon: '🔍',
          tags: {
            alert_id: item.id,
            alert_name: item.name,
            last_run: item.lastRun?.toISOString() || 'null',
            stories_filtered: filteredStories.length,
            stories_total: stories.length,
            type: 'info',
          },
        })

        // Update lastRun to current time before setting nextRun
        const currentTime = new Date()

        let nextRun: Date | null = null
        if (item.wait.type === 'count') {
          nextRun = new Date(Date.now() + 60 * 60 * 1000)
          await db
            .update(alert)
            .set({ lastRun: currentTime, nextRun })
            .where(eq(alert.id, item.id))
        }
        if (item.wait.type === 'schedule') {
          nextRun = findNextRunDateBasedOnSchedule(item.wait.value)
          await db
            .update(alert)
            .set({ lastRun: currentTime, nextRun })
            .where(eq(alert.id, item.id))
        }

        // Only send alert if there are new stories since lastRun
        if (filteredStories.length > 0) {
          // Send email to the all subscribers of the alert
          const subscribers = await db.query.subscriptions.findMany({
            where: eq(subscriptions.alertId, item.id),
          })

          for (const subscriber of subscribers) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, subscriber.userId),
            })
            await herald({
              alertName: item.name,
              channelId: subscriber.channelId,
              stories: filteredStories,
              user,
            })
          }
        } else {
          await track({
            channel: 'worker',
            description: `No new stories since last run - skipping alert delivery`,
            event: 'Alert Delivery Skipped',
            icon: '⏭️',
            tags: {
              alert_id: item.id,
              alert_name: item.name,
              last_run: item.lastRun?.toISOString() || 'null',
              type: 'info',
            },
          })
        }

        await track({
          channel: 'worker',
          description: `Completed processing: ${item.name} - Found ${stories.length} stories, sent ${filteredStories.length} new stories`,
          event: 'Alert Processed',
          icon: '✅',
          tags: {
            alert_id: item.id,
            alert_name: item.name,
            next_run: nextRun?.toISOString() || 'unknown',
            stories_created: stories.length,
            stories_sent: filteredStories.length,
            type: 'info',
            urls_found: urls.length,
            wait_type: item.wait.type,
          },
        })
      }

      // Run custodian to clean up stories with empty titles
      const custodianResult = await custodian()

      await track({
        channel: 'cron',
        description: `Alert processing completed successfully - processed ${found.length} alerts, cleaned up ${custodianResult.deletedCount} empty stories`,
        event: 'Alert Processing Completed',
        icon: '🎉',
        tags: {
          alerts_processed: found.length,
          empty_stories_deleted: custodianResult.deletedCount,
          timestamp: new Date().toISOString(),
          triggered_by: 'cron',
          type: 'info',
        },
      })

      return c.json({
        alerts_processed: found.length,
        empty_stories_deleted: custodianResult.deletedCount,
        ok: true,
        timestamp: new Date().toISOString(),
        triggered_by: 'cron',
      })
    } catch (error) {
      await track({
        channel: 'cron',
        description: `Alert processing failed: ${String(error)}`,
        event: 'Alert Processing Failed',
        icon: '💥',
        tags: {
          error: String(error),
          timestamp: new Date().toISOString(),
          triggered_by: 'cron',
          type: 'error',
        },
      })
      throw error
    }
  },
)
