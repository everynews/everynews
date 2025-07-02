import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { channels, stories } from '@everynews/schema'
import { subscriptions } from '@everynews/schema/subscription'
import { and, eq, isNotNull, isNull, notInArray } from 'drizzle-orm'

export const custodian = async (): Promise<{
  deletedCount: number
  deletedStories: Array<{ id: string; url: string }>
  orphanedSubscriptionsCount: number
}> => {
  try {
    await track({
      channel: 'custodian',
      description: 'Starting cleanup of stories with empty titles',
      event: 'Custodian Started',
      icon: '🧹',
      tags: {
        type: 'info',
      },
    })

    // Find all stories with empty titles that are not soft-deleted
    const emptyTitleStories = await db.query.stories.findMany({
      where: and(eq(stories.title, ''), isNull(stories.deletedAt)),
    })

    if (emptyTitleStories.length === 0) {
      await track({
        channel: 'custodian',
        description: 'No stories with empty titles found',
        event: 'No Cleanup Needed',
        icon: '✨',
        tags: {
          type: 'info',
        },
      })
      return {
        deletedCount: 0,
        deletedStories: [],
        orphanedSubscriptionsCount: 0,
      }
    }

    await track({
      channel: 'custodian',
      description: `Found ${emptyTitleStories.length} stories with empty titles to delete`,
      event: 'Empty Title Stories Found',
      icon: '🔍',
      tags: {
        count: emptyTitleStories.length,
        type: 'info',
      },
    })

    // Delete stories with empty titles
    const deletedStories = []
    for (const story of emptyTitleStories) {
      try {
        // Soft delete by setting deletedAt
        await db
          .update(stories)
          .set({ deletedAt: new Date() })
          .where(and(eq(stories.id, story.id), isNull(stories.deletedAt)))
        deletedStories.push({ id: story.id, url: story.url })

        await track({
          channel: 'custodian',
          description: `Soft deleted story: ${story.url}`,
          event: 'Story Soft Deleted',
          icon: '🗑️',
          tags: {
            story_id: story.id,
            type: 'info',
            url: story.url.slice(0, 160),
          },
        })
      } catch (error) {
        await track({
          channel: 'custodian',
          description: `Failed to delete story ${story.id}: ${String(error)}`,
          event: 'Story Deletion Failed',
          icon: '❌',
          tags: {
            error: String(error),
            story_id: story.id,
            type: 'error',
            url: story.url.slice(0, 160),
          },
        })
      }
    }

    // Cleanup orphaned subscriptions
    await track({
      channel: 'custodian',
      description: 'Starting cleanup of orphaned subscriptions',
      event: 'Orphaned Subscriptions Cleanup Started',
      icon: '🔧',
      tags: {
        type: 'info',
      },
    })

    // Find all active (non-deleted) channel IDs
    const activeChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .where(isNull(channels.deletedAt))

    const activeChannelIds = activeChannels.map((channel) => channel.id)

    // Find orphaned subscriptions (subscriptions with deleted or non-existent channels)
    let orphanedSubscriptionsCount = 0

    if (activeChannelIds.length > 0) {
      // Find subscriptions where channelId is not null, not deleted, but channel doesn't exist in active channels
      const orphanedSubscriptions = await db.query.subscriptions.findMany({
        where: and(
          isNotNull(subscriptions.channelId),
          isNull(subscriptions.deletedAt),
          notInArray(subscriptions.channelId, activeChannelIds),
        ),
      })

      orphanedSubscriptionsCount = orphanedSubscriptions.length

      if (orphanedSubscriptionsCount > 0) {
        // Soft delete orphaned subscriptions
        for (const subscription of orphanedSubscriptions) {
          try {
            await db
              .update(subscriptions)
              .set({ deletedAt: new Date() })
              .where(
                and(
                  eq(subscriptions.id, subscription.id),
                  isNull(subscriptions.deletedAt),
                ),
              )

            await track({
              channel: 'custodian',
              description: `Soft deleted orphaned subscription: ${subscription.id}`,
              event: 'Orphaned Subscription Soft Deleted',
              icon: '🔗',
              tags: {
                channel_id: subscription.channelId || 'null',
                subscription_id: subscription.id,
                type: 'info',
              },
            })
          } catch (error) {
            await track({
              channel: 'custodian',
              description: `Failed to delete orphaned subscription ${subscription.id}: ${String(error)}`,
              event: 'Orphaned Subscription Deletion Failed',
              icon: '❌',
              tags: {
                error: String(error),
                subscription_id: subscription.id,
                type: 'error',
              },
            })
          }
        }

        await track({
          channel: 'custodian',
          description: `Cleaned up ${orphanedSubscriptionsCount} orphaned subscriptions`,
          event: 'Orphaned Subscriptions Cleaned',
          icon: '✅',
          tags: {
            count: orphanedSubscriptionsCount,
            type: 'info',
          },
        })
      } else {
        await track({
          channel: 'custodian',
          description: 'No orphaned subscriptions found',
          event: 'No Orphaned Subscriptions',
          icon: '✨',
          tags: {
            type: 'info',
          },
        })
      }
    } else {
      // If there are no active channels, soft delete all non-deleted subscriptions with channelId
      const allSubscriptionsWithChannels =
        await db.query.subscriptions.findMany({
          where: and(
            isNotNull(subscriptions.channelId),
            isNull(subscriptions.deletedAt),
          ),
        })

      orphanedSubscriptionsCount = allSubscriptionsWithChannels.length

      if (orphanedSubscriptionsCount > 0) {
        await db
          .update(subscriptions)
          .set({ deletedAt: new Date() })
          .where(
            and(
              isNotNull(subscriptions.channelId),
              isNull(subscriptions.deletedAt),
            ),
          )

        await track({
          channel: 'custodian',
          description: `No active channels found. Cleaned up ${orphanedSubscriptionsCount} subscriptions`,
          event: 'All Channel Subscriptions Cleaned',
          icon: '🧹',
          tags: {
            count: orphanedSubscriptionsCount,
            type: 'info',
          },
        })
      }
    }

    await track({
      channel: 'custodian',
      description: `Cleanup completed: deleted ${deletedStories.length} stories and ${orphanedSubscriptionsCount} orphaned subscriptions`,
      event: 'Custodian Completed',
      icon: '✅',
      tags: {
        deleted_stories_count: deletedStories.length,
        orphaned_subscriptions_count: orphanedSubscriptionsCount,
        type: 'info',
      },
    })

    return {
      deletedCount: deletedStories.length,
      deletedStories,
      orphanedSubscriptionsCount,
    }
  } catch (error) {
    await track({
      channel: 'custodian',
      description: `Custodian failed: ${String(error)}`,
      event: 'Custodian Failed',
      icon: '💥',
      tags: {
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}
