import crypto from 'node:crypto'
import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { AlertSchema, alert } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, asc, eq, lt } from 'drizzle-orm'
import { type Context, Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import PQueue from 'p-queue'
import { processAlert } from '../subroutines/cron'
import { custodian } from '../subroutines/custodian'

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

      // Process all alerts concurrently with error handling
      // for now, we'll process one alert at a time
      const queue = new PQueue({ concurrency: 1 })
      const results = await Promise.allSettled(
        found.map((item) => queue.add(async () => processAlert(item))),
      )

      // Run custodian to clean up stories with empty titles
      const custodianResult = await custodian()

      const successfulAlerts = results.filter(
        (result): result is PromiseFulfilledResult<void> =>
          result.status === 'fulfilled',
      )
      const failedAlerts = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      )

      await track({
        channel: 'cron',
        description: `Alert processing completed - processed ${successfulAlerts.length}/${found.length} alerts successfully, ${failedAlerts.length} failed, cleaned up ${custodianResult.deletedCount} empty stories`,
        event: 'Alert Processing Completed',
        icon: failedAlerts.length > 0 ? '⚠️' : '🎉',
        tags: {
          alerts_failed: failedAlerts.length,
          alerts_processed: found.length,
          alerts_successful: successfulAlerts.length,
          empty_stories_deleted: custodianResult.deletedCount,
          timestamp: new Date().toISOString(),
          triggered_by: 'cron',
          type: failedAlerts.length > 0 ? 'warning' : 'info',
        },
      })

      return c.json({
        alerts_failed: failedAlerts.length,
        alerts_processed: found.length,
        alerts_successful: successfulAlerts.length,
        empty_stories_deleted: custodianResult.deletedCount,
        ok: failedAlerts.length === 0,
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
