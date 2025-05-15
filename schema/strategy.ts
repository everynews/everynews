import { z } from 'zod'
import 'zod-openapi/extend'
export const strategySchema = z
  .discriminatedUnion('provider', [
    z.object({
      provider: z.literal('hnbest').openapi({ example: 'hnbest' }),
    }),
    z.object({
      provider: z.literal('kagi').openapi({ example: 'kagi' }),
      query: z.string().openapi({ example: 'News' }),
    }),
  ])
  .openapi({ ref: 'Strategy' })
