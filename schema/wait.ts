import { z } from 'zod'
import 'zod-openapi/extend'

export const WaitSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('count').openapi({ example: 'count' }),
      value: z.coerce.number().openapi({ example: 10 }),
    }),
    z.object({
      type: z.literal('schedule').openapi({ example: 'schedule' }),
      value: z.coerce.string().openapi({ example: '0 0 * * *' }),
    }),
  ])
  .openapi({ ref: 'WaitSchema' })
