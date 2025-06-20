import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { boolean, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user'

export const channels = pgTable('channels', {
  config: json('config').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  id: text('id').primaryKey().$defaultFn(nanoid),
  name: text('name').notNull(),
  type: text('type').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at'),
})

const BaseChannel = z
  .object({
    createdAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable(),
    id: z.coerce.string(),
    name: z.coerce.string(),
    updatedAt: z.coerce.date(),
    userId: z.coerce.string(),
    verified: z.boolean(),
    verifiedAt: z.coerce.date().nullable(),
  })
  .openapi({ ref: 'BaseChannel' })

const EmailChannelSchema = BaseChannel.extend({
  config: z.object({
    destination: z.string().email().openapi({ example: 'email@example.com' }),
  }),
  type: z.literal('email').openapi({ example: 'email' }),
}).openapi({ ref: 'EmailChannelSchema' })

// const SlackChannelSchema = BaseChannel.extend({
//   config: z.object({
//     destination: z.string().openapi({
//       example:
//         'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
//     }),
//   }),
//   type: z.literal('slack').openapi({ example: 'slack' }),
// }).openapi({ ref: 'SlackChannelSchema' })

export const ChannelSchema = EmailChannelSchema

const EmailChannelDtoSchema = EmailChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi({ ref: 'EmailChannelDtoSchema' })

// const SlackChannelDtoSchema = SlackChannelSchema.omit({
//   createdAt: true,
//   id: true,
//   updatedAt: true,
//   userId: true,
// }).openapi({ ref: 'SlackChannelDtoSchema' })

export const ChannelDtoSchema = EmailChannelDtoSchema

export type Channel = z.infer<typeof ChannelSchema>
export type ChannelDto = z.infer<typeof ChannelDtoSchema>
