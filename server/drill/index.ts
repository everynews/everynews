import { track } from '@everynews/logs'
import { StorySchema } from '@everynews/schema'
import { AlertDtoSchema } from '@everynews/schema/alert'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import type { WithAuth } from '../bindings/auth'
import { aspirant } from '../subroutines/aspirant'

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
  validator('json', AlertDtoSchema),
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

    // Create a temporary alert object for testing
    const testAlert = {
      active: true,
      createdAt: new Date(),
      description: alertData.description,
      id: 'drill-alert',
      isPublic: alertData.isPublic,
      language: alertData.language,
      lastRun: null,
      name: alertData.name,
      nextRun: null,
      promptId: alertData.promptId,
      strategy: alertData.strategy,
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
