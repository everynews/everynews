import { z } from 'zod'
import 'zod-openapi/extend'

import { strategySchema } from './strategy'
import { waitSchema } from './wait'

export const NewsSchema = z
  .object({
    active: z.coerce.boolean().openapi({ example: true }),
    createdAt: z.coerce.date().openapi({ example: '2025-05-14T12:15:28.123Z' }),
    id: z.coerce.string().openapi({ example: '123' }),
    isPublic: z.coerce.boolean().openapi({ example: true }),
    lastRun: z.coerce
      .date()
      .nullable()
      .openapi({ example: '2025-05-14T12:15:28.123Z' }),
    name: z.coerce
      .string()
      .min(1, 'Name is required')
      .openapi({ example: 'News' }),
    nextRun: z.coerce
      .date()
      .nullable()
      .openapi({ example: '2025-05-14T12:15:28.123Z' }),
    strategy: strategySchema,
    updatedAt: z.coerce.date().openapi({ example: '2025-05-14T12:15:28.123Z' }),
    userId: z.coerce.string().openapi({ example: '123' }),
    wait: waitSchema,
  })
  .openapi({ ref: 'News' })

export const NewsDtoSchema = NewsSchema.omit({
  createdAt: true,
  id: true,
  lastRun: true,
  nextRun: true,
  updatedAt: true,
  userId: true,
})

export type News = z.infer<typeof NewsSchema>
export type NewsDto = z.infer<typeof NewsDtoSchema>
