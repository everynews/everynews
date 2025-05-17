import { z } from 'zod'
import 'zod-openapi/extend'

// Wait is a JSON field in the news table, so there is no pgTable definition
export const waitSchema = z
  .object({
    count: z.coerce.number().nullable().openapi({ example: 10 }),
    cron: z.coerce.string().nullable().openapi({ example: '0 0 * * *' }),
  })
  .refine((data) => data.count !== null || data.cron !== null, {
    message: 'At least one wait setting must be provided',
  })
  .openapi({ ref: 'Wait' })
