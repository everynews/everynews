import { z } from '@hono/zod-openapi'
import { strategySchema } from './strategy'
import { waitSchema } from './wait'

export const newsSchema = z
  .object({
    active: z.boolean().openapi({ example: true }),
    createdAt: z.date().openapi({ example: '2025-05-14T12:15:28.123Z' }),
    id: z.string().openapi({ example: '123' }),
    lastRun: z
      .date()
      .nullable()
      .openapi({ example: '2025-05-14T12:15:28.123Z' }),
    name: z.string().min(1, 'Name is required').openapi({ example: 'News' }),
    nextRun: z
      .date()
      .nullable()
      .openapi({ example: '2025-05-14T12:15:28.123Z' }),
    public: z.boolean().openapi({ example: true }),
    strategy: strategySchema,
    updatedAt: z.date().openapi({ example: '2025-05-14T12:15:28.123Z' }),
    userId: z.string().openapi({ example: '123' }),
    wait: waitSchema,
  })
  .openapi('News')

export const NewsDtoSchema = newsSchema.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
  userId: true,
})

export type News = z.infer<typeof newsSchema>
export type NewsDto = z.infer<typeof NewsDtoSchema>
