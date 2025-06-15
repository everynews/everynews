import { track } from '@everynews/logs'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { z } from 'zod'
import { resolver, validator } from 'hono-openapi/zod'
import { custodian } from '../subroutines/custodian'

const CustodianResultSchema = z.object({
  deletedCount: z.number(),
  deletedStories: z.array(z.object({
    id: z.string(),
    url: z.string(),
  })),
})

// Dev-only middleware
const devOnlyMiddleware = async (c: any, next: any) => {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (!isDev) {
    await track({
      channel: 'custodian',
      description: 'Attempted to access custodian endpoint in production',
      event: 'Unauthorized Custodian Access',
      icon: '🚫',
      tags: {
        environment: process.env.NODE_ENV || 'unknown',
        ip: c.req.header('x-forwarded-for') || 'unknown',
        type: 'error',
      },
    })
    return c.json({ error: 'This endpoint is only available in development mode' }, 403)
  }
  
  await next()
}

export const CustodianRouter = new Hono()
  .use(devOnlyMiddleware)
  .post(
    '/',
    describeRoute({
      description: 'Run custodian to clean up stories with empty titles (Dev only)',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(CustodianResultSchema),
            },
          },
          description: 'Custodian execution result',
        },
        403: {
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
          description: 'Forbidden - Only available in development',
        },
        500: {
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
          description: 'Internal server error',
        },
      },
    }),
    async (c) => {
      try {
        await track({
          channel: 'custodian',
          description: 'Manual custodian run initiated',
          event: 'Manual Custodian Start',
          icon: '🧹',
          tags: {
            source: 'api',
            type: 'info',
          },
        })

        const result = await custodian()

        await track({
          channel: 'custodian',
          description: `Manual custodian run completed: ${result.deletedCount} stories deleted`,
          event: 'Manual Custodian Complete',
          icon: '✅',
          tags: {
            deleted_count: result.deletedCount,
            source: 'api',
            type: 'info',
          },
        })

        return c.json(result)
      } catch (error) {
        await track({
          channel: 'custodian',
          description: `Manual custodian run failed: ${String(error)}`,
          event: 'Manual Custodian Failed',
          icon: '💥',
          tags: {
            error: String(error),
            source: 'api',
            type: 'error',
          },
        })
        
        return c.json({ error: `Custodian failed: ${String(error)}` }, 500)
      }
    }
  )