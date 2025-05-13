import { z } from '@hono/zod-openapi'

export const strategySchema = z
  .object({
    provider: z.string().openapi({ example: 'kagi' }),
    query: z.string().optional().openapi({ example: 'News' }),
  })
  .openapi('Strategy')
