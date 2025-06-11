import crypto from 'node:crypto'
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
import { type Context, Hono } from 'hono'
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

export const CronRouter = new Hono()
  .post(
    '/',
    describeRoute({
      description: 'Run Cron Job - Newsletter Processing',
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
                type: 'object',
                properties: {
                  error: { type: 'string' }
                }
              }
            }
          },
          description: 'Unauthorized'
        },
        503: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                }
              }
            }
          },
          description: 'Service Unavailable'
        }
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
          event: 'Newsletter Processing Started',
          icon: '🤖',
          tags: {
            timestamp: new Date().toISOString(),
            triggered_by: 'cron',
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
          channel: 'cron',
          description: `Newsletter processing completed successfully - processed ${found.length} newsletters`,
          event: 'Newsletter Processing Completed',
          icon: '🎉',
          tags: {
            newsletters_processed: found.length,
            timestamp: new Date().toISOString(),
            triggered_by: 'cron',
            type: 'info',
          },
        })

        return c.json({
          newsletters_processed: found.length,
          ok: true,
          timestamp: new Date().toISOString(),
          triggered_by: 'cron',
        })
      } catch (error) {
        await track({
          channel: 'cron',
          description: `Newsletter processing failed: ${String(error)}`,
          event: 'Newsletter Processing Failed',
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
