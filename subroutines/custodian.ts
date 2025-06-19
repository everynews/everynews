import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { stories } from '@everynews/schema'
import { and, eq, isNull } from 'drizzle-orm'

export const custodian = async (): Promise<{
  deletedCount: number
  deletedStories: Array<{ id: string; url: string }>
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

    await track({
      channel: 'custodian',
      description: `Cleanup completed: deleted ${deletedStories.length} stories`,
      event: 'Custodian Completed',
      icon: '✅',
      tags: {
        deleted_count: deletedStories.length,
        type: 'info',
      },
    })

    return {
      deletedCount: deletedStories.length,
      deletedStories,
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
