import { z } from 'zod'
import 'zod-openapi/extend'

// Strategy is a JSON field in the news table, so there is no pgTable definition
export const strategySchema = z
  .discriminatedUnion('provider', [
    z.object({
      provider: z.literal('hnbest').openapi({ example: 'hnbest' }),
      query: z.string().optional().openapi({ example: 'News' }),
    }),
    z.object({
      provider: z.literal('google').openapi({ example: 'google' }),
      query: z.string().optional().openapi({ example: 'News' }),
    }),
  ])
  .openapi({ ref: 'StrategySchema' })

export type Strategy = z.infer<typeof strategySchema>
