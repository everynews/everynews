import crypto from 'node:crypto'
import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { AlertSchema, alerts } from '@everynews/schema'
import { processAlert } from '@everynews/server/cron/worker'
import { custodian } from '@everynews/subroutines/custodian'
import { and, asc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import PQueue from 'p-queue'
import { z } from 'zod'

const CronResponseSchema = z.object({
  alerts_failed: z.number(),
  alerts_processed: z.number(),
  alerts_successful: z.number(),
  empty_stories_deleted: z.number(),
})

export const CronRouter = new Hono().get(
  '/',
  describeRoute({
    description: 'Process scheduled alerts',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: resolver(CronResponseSchema),
          },
        },
        description: 'Cron job executed successfully',
      },
    },
  }),
  async (c) => {
    console.log('Cron API called')
    console.log('process.env.NODE_ENV:', process.env.NODE_ENV)

    if (
      (c.req.header('Authorization') ?? '').length !==
      `Bearer ${process.env.CRON_SECRET}`.length
    ) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (
      !crypto.timingSafeEqual(
        Buffer.from(`Bearer ${process.env.CRON_SECRET}`),
        Buffer.from(c.req.header('Authorization') ?? ''),
      )
    ) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await track({
      channel: 'cron',
      event: 'Alert Processing Started',
      icon: '🤖',
      tags: {
        timestamp: new Date().toISOString(),
        triggered_by: 'api',
        type: 'info',
      },
    })

    const found = AlertSchema.array().parse(
      await db.query.alerts.findMany({
        orderBy: asc(alerts.lastRun),
        where: and(eq(alerts.active, true), lt(alerts.nextRun, new Date())),
      }),
    )

    await track({
      channel: 'cron',
      event: `${found.length} Alerts Found`,
      icon: '📋',
      tags: {
        alerts_count: found.length,
        type: 'info',
      },
    })

    const queue = new PQueue({ concurrency: 16 })
    const results = await Promise.allSettled(
      found.map((item) => queue.add(async () => processAlert(item))),
    )

    const successfulAlerts = results.filter(
      (result): result is PromiseFulfilledResult<void> =>
        result.status === 'fulfilled',
    )
    const failedAlerts = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )

    const custodianResult = await custodian()

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
        triggered_by: 'api',
        type: failedAlerts.length > 0 ? 'warning' : 'info',
      },
    })

    return c.json({
      alerts_failed: failedAlerts.length,
      alerts_processed: found.length,
      alerts_successful: successfulAlerts.length,
      empty_stories_deleted: custodianResult.deletedCount,
    })
  },
)
