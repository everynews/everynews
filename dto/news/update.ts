import { z } from 'zod'

export const updateNewsDtoSchema = z.object({
  active: z.boolean(),
  name: z.string().min(1, 'Name is required'),
  public: z.boolean(),
  strategy: z.object({
    provider: z.string(),
    query: z.string().optional(),
  }),
  wait: z.object({
    count: z.number().nullable(),
    cron: z.string().nullable(),
  }),
})

export type UpdateNewsDto = z.infer<typeof updateNewsDtoSchema>
