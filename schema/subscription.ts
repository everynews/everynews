import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { channels } from './channel'
import { news } from './news'
import { users } from './user'

export const subscriptions = pgTable('subscriptions', {
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

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
