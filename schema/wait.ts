import { z } from 'zod'
import 'zod-openapi/extend'

export const waitSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('count'),
      value: z.coerce.number().openapi({ example: 10 }),
    }),
    z.object({
      type: z.literal('cron'),
      value: z.coerce.string().openapi({ example: '0 0 * * *' }),
    }),
  ])
  .openapi({ ref: 'Wait' })
