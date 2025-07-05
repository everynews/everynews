import { z } from '@hono/zod-openapi'

export const WorkerStatusSchema = z
  .object({
    ok: z.boolean().openapi({ example: true }),
  })
  .openapi('WorkerStatusSchema')
