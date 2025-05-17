import { z } from 'zod'
import 'zod-openapi/extend'

// Strategy is a JSON field in the news table, so there is no pgTable definition
export const strategySchema = z
  .discriminatedUnion('provider', [
    z.object({
      provider: z.literal('hnbest').openapi({ example: 'hnbest' }),
    }),
    z.object({
      provider: z.literal('exa').openapi({ example: 'exa' }),
      query: z.string().openapi({ example: 'News' }),
    }),
  ])
  .openapi({ ref: 'Strategy' })
