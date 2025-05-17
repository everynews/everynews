import { z } from 'zod'
import 'zod-openapi/extend'

export const SubscriptionSchema = z
  .object({
    channelId: z.string().openapi({ example: 'channel123' }),
    createdAt: z.coerce.date().openapi({ example: '2025-05-14T12:15:28.123Z' }),
    id: z.string().openapi({ example: '123' }),
    newsId: z.string().openapi({ example: 'news123' }),
    updatedAt: z.coerce.date().openapi({ example: '2025-05-14T12:15:28.123Z' }),
    userId: z.string().openapi({ example: 'user123' }),
  })
  .openapi({ ref: 'Subscription' })

export const SubscriptionDtoSchema = SubscriptionSchema.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
})
