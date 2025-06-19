import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { alerts } from './alert'
import { channels } from './channel'
import { users } from './user'

export const subscriptions = pgTable('subscriptions', {
  alertId: text('alert_id')
    .notNull()
    .references(() => alerts.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').references(() => channels.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  id: text('id').primaryKey().$defaultFn(nanoid),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const SubscriptionSchema = z
  .object({
    alertId: z.string().openapi({ example: 'alert123' }),
    channelId: z.string().nullable().openapi({ example: 'channel123' }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    deletedAt: z.coerce.date().nullable().openapi({ example: null }),
    id: z.string().openapi({ example: '123' }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    userId: z.string().openapi({ example: 'user123' }),
  })
  .openapi({ ref: 'SubscriptionSchema' })

export const SubscriptionDtoSchema = SubscriptionSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
})
  .extend({
    channelId: z.string().nullable().openapi({ example: 'channel123' }),
  })
  .openapi({ ref: 'SubscriptionDtoSchema' })

export type Subscription = z.infer<typeof SubscriptionSchema>

export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>
