import { track } from '@everynews/logs'
import { StorySchema } from '@everynews/schema'
import { AlertDtoSchema } from '@everynews/schema/alert'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { aspirant } from '@everynews/subroutines/aspirant'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'

export const DrillRouter = new Hono<WithAuth>().use(authMiddleware).post(
  '/',
  describeRoute({
    description: 'Test alert configuration',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: resolver(StorySchema.array()),
          },
        },
        description: 'Test alert result',
      },
    },
  }),
  zValidator('json', AlertDtoSchema),
  async (c) => {
    const user = c.get('user')
    if (!user) {
      await track({
        channel: 'drill',
        description: 'User tried to test alert without authentication',
        event: 'Unauthorized Drill Test',
        icon: '🚫',
        tags: {
          type: 'error',
        },
      })
      return c.json({ error: 'Unauthorized' }, 401)
    }
    const alertData = await c.req.json()
    const testAlert = {
      active: true,
      createdAt: new Date(),
      deletedAt: null,
      description: alertData.description,
      fastLastSent: null,
      id: 'drill-alert',
      isPublic: alertData.isPublic,
      languageCode: alertData.languageCode,
      lastRun: null,
      lastSent: null,
      name: alertData.name,
      nextRun: null,
      promptId: alertData.promptId,
      slowLastSent: null,
      strategy: alertData.strategy,
      threshold: alertData.threshold,
      updatedAt: new Date(),
      userId: user.id,
      wait: alertData.wait,
    }
    try {
      const stories = await aspirant(testAlert)
      await track({
        channel: 'drill',
        description: `Tested alert configuration: ${alertData.name}`,
        event: 'Drill Test Completed',
        icon: '🧪',
        tags: {
          stories_count: stories.length,
          strategy_provider: alertData.strategy.provider,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json(stories)
    } catch (error) {
      await track({
        channel: 'drill',
        description: `Drill test failed: ${String(error)}`,
        event: 'Drill Test Failed',
        icon: '❌',
        tags: {
          error: String(error),
          type: 'error',
        },
        user_id: user.id,
      })
      return c.json({ details: String(error), error: 'Test failed' }, 500)
    }
  },
)
