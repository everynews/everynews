import { z } from 'zod'
import 'zod-openapi/extend'
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
