import { z } from 'zod'
import 'zod-openapi/extend'

export const strategySchema = z
  .object({
    provider: z.string().openapi({ example: 'kagi' }),
    query: z.string().optional().openapi({ example: 'News' }),
  })
  .openapi({ ref: 'Strategy' })
