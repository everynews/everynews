import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { relations } from 'drizzle-orm'
import { boolean, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { channelVerifications } from './channel-verification'
import { subscriptions } from './subscription'
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

const PhoneChannelSchema = BaseChannel.extend({
  config: z.object({
    destination: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, {
        message: 'Phone number must be in E.164 format (e.g., +1234567890)',
      })
      .openapi({ example: '+18015551234' }),
  }),
  type: z.literal('phone').openapi({ example: 'phone' }),
}).openapi({ ref: 'PhoneChannelSchema' })

export const SlackChannelConfigSchema = z.object({
  accessToken: z.string().openapi({ example: 'xoxb-...' }),
  channel: z.object({
    id: z.string().openapi({ example: 'C00000000' }),
    name: z.string().openapi({ example: 'general' }),
  }),
  destination: z.string().optional().openapi({ example: '#general' }),
  teamId: z.string().openapi({ example: 'T00000000' }),
  workspace: z.object({
    id: z.string().openapi({ example: 'T00000000' }),
    name: z.string().openapi({ example: 'My Workspace' }),
  }), // For display purposes
})

const SlackChannelSchema = BaseChannel.extend({
  config: SlackChannelConfigSchema,
  type: z.literal('slack').openapi({ example: 'slack' }),
}).openapi({ ref: 'SlackChannelSchema' })

export const ChannelSchema = z.discriminatedUnion('type', [
  EmailChannelSchema,
  PhoneChannelSchema,
  SlackChannelSchema,
])

const EmailChannelDtoSchema = EmailChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi({ ref: 'EmailChannelDtoSchema' })

const PhoneChannelDtoSchema = PhoneChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi({ ref: 'PhoneChannelDtoSchema' })

const SlackChannelDtoSchema = SlackChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi({ ref: 'SlackChannelDtoSchema' })

export const ChannelDtoSchema = z.discriminatedUnion('type', [
  EmailChannelDtoSchema,
  PhoneChannelDtoSchema,
  SlackChannelDtoSchema,
])

export type Channel = z.infer<typeof ChannelSchema>
export type ChannelDto = z.infer<typeof ChannelDtoSchema>

// Extract individual channel config types
export type SlackChannelConfig = z.infer<typeof SlackChannelSchema>['config']
export type EmailChannelConfig = z.infer<typeof EmailChannelSchema>['config']
export type PhoneChannelConfig = z.infer<typeof PhoneChannelSchema>['config']

export const channelsRelations = relations(channels, ({ one, many }) => ({
  subscriptions: many(subscriptions),
  user: one(users, {
    fields: [channels.userId],
    references: [users.id],
  }),
  verifications: many(channelVerifications),
}))
