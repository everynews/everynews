import { z } from 'zod'

export const ResendResponseSchema = z
  .object({
    id: z.string().optional(),
  })
  .passthrough()

export type ResendResponse = z.infer<typeof ResendResponseSchema>
