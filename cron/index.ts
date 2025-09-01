import { refreshExpiredSlackTokens } from '@everynews/cron/slack-token-refresh'
import { processAlert } from '@everynews/cron/worker'
import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { AlertSchema, alerts } from '@everynews/schema'
import { custodian } from '@everynews/subroutines/custodian'
import { and, asc, eq, isNull, lt } from 'drizzle-orm'
import PQueue from 'p-queue'

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

const main = async () => {
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
      where: and(
        eq(alerts.active, true),
        lt(alerts.nextRun, new Date()),
        isNull(alerts.deletedAt),
      ),
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
    found.map((item) =>
      queue.add(async () =>
        withTimeout(
          processAlert(item),
          5 * 60 * 1000, // 5 minutes per alert
          `Alert processing timeout for: ${item.name}`,
        ),
      ),
    ),
  )

  const successfulAlerts = results.filter(
    (result): result is PromiseFulfilledResult<void> =>
      result.status === 'fulfilled',
  )
  const failedAlerts = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  )

  const custodianResult = await withTimeout(
    custodian(),
    2 * 60 * 1000, // 2 minutes for custodian
    'Custodian timeout after 2 minutes',
  )

  // Refresh expired Slack tokens
  try {
    await withTimeout(
      refreshExpiredSlackTokens(),
      5 * 60 * 1000, // 5 minutes for token refresh
      'Slack token refresh timeout after 5 minutes',
    )
  } catch (error) {
    await track({
      channel: 'cron',
      description: 'Failed to refresh Slack tokens during cron job',
      event: 'Slack Token Refresh Failed',
      icon: '⚠️',
      tags: {
        error: String(error),
        type: 'warning',
      },
    })
  }

  await track({
    channel: 'cron',
    description: `Alert processing completed - processed ${successfulAlerts.length}/${found.length} alerts successfully, ${failedAlerts.length} failed, cleaned up ${custodianResult.deletedCount} empty stories and ${custodianResult.orphanedSubscriptionsCount} orphaned subscriptions`,
    event: 'Alert Processing Completed',
    icon: failedAlerts.length > 0 ? '⚠️' : '🎉',
    tags: {
      alerts_failed: failedAlerts.length,
      alerts_processed: found.length,
      alerts_successful: successfulAlerts.length,
      empty_stories_deleted: custodianResult.deletedCount,
      orphaned_subscriptions_deleted:
        custodianResult.orphanedSubscriptionsCount,
      timestamp: new Date().toISOString(),
      triggered_by: 'api',
      type: failedAlerts.length > 0 ? 'warning' : 'info',
    },
  })
}

// Global timeout for the entire cron job (30 minutes)
const GLOBAL_TIMEOUT = 30 * 60 * 1000

withTimeout(main(), GLOBAL_TIMEOUT, 'Global cron job timeout after 30 minutes')
  .then(() => {
    const isCI =
      process.env.CI === 'true' ||
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.ACTIONS === 'true'
    if (!isCI) {
      console.log('Cron job completed successfully')
    }
    process.exit(0)
  })
  .catch((error) => {
    const isCI =
      process.env.CI === 'true' ||
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.ACTIONS === 'true'
    if (!isCI) {
      console.error('Cron job failed:', error)
    }
    track({
      channel: 'cron',
      event: 'Cron Job Failed',
      icon: '💥',
      tags: {
        error: String(error),
        type: 'error',
      },
    }).finally(() => {
      process.exit(1)
    })
  })
