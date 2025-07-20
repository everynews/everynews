import { z } from 'zod'

export const EmailProviderResponseSchema = z
  .object({
    id: z.string().optional(),
  })
  .passthrough()

export type EmailProviderResponse = z.infer<typeof EmailProviderResponseSchema>
