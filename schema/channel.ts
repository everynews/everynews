import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user'

export const channels = pgTable('channels', {
  config: json('config').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  name: text('name').notNull(),
  type: text('type').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

const BaseChannel = z.object({
  createdAt: z.coerce.date(),
  id: z.coerce.string(),
  name: z.coerce.string(),
  updatedAt: z.coerce.date(),
  userId: z.coerce.string(),
})

const EmailChannelSchema = BaseChannel.extend({
  config: z.object({
    destination: z.string().email().openapi({ example: 'email@example.com' }),
  }),
  type: z.literal('email').openapi({ example: 'email' }),
})

const SlackChannelSchema = BaseChannel.extend({
  config: z.object({
    destination: z.string().openapi({
      example:
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    }),
  }),
  type: z.literal('slack').openapi({ example: 'slack' }),
})

export const ChannelSchema = z.discriminatedUnion('type', [
  EmailChannelSchema,
  SlackChannelSchema,
])

const EmailDtoSchema = EmailChannelSchema.omit({
  createdAt: true,
  updatedAt: true,
  userId: true,
})

const SlackDtoSchema = SlackChannelSchema.omit({
  createdAt: true,
  updatedAt: true,
  userId: true,
})

export const ChannelDtoSchema = z.discriminatedUnion('type', [
  EmailDtoSchema,
  SlackDtoSchema,
])
