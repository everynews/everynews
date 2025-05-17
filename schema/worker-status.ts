import { z } from 'zod'
import 'zod-openapi/extend'

export const WorkerStatusSchema = z
  .object({
    ok: z.boolean().openapi({ example: true }),
  })
  .openapi({ ref: 'WorkerStatus' })
