import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { AlertSchema, alert } from '@everynews/schema'
import { and, asc, eq, lt } from 'drizzle-orm'
import PQueue from 'p-queue'
import { processAlert } from '@everynews/cron/process-alert'
import { custodian } from '@everynews/subroutines/custodian'



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
        channel: 'cron',
        event: `${found.length} Alerts Found`,
        icon: '📋',
        tags: {
          alerts_count: found.length,
          type: 'info',
        },
      })

      const queue = new PQueue({ concurrency: 1 })
      const results = await Promise.allSettled(
        found.map((item) => queue.add(async () => processAlert(item))),
      )

      
      const successfulAlerts = results.filter(
        (result): result is PromiseFulfilledResult<void> =>
          result.status === 'fulfilled',
      )
      const failedAlerts = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
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
          triggered_by: 'cron',
          type: failedAlerts.length > 0 ? 'warning' : 'info',
        },
      })

     