import { nanoid } from '@everynews/lib/id'
import { z } from '@hono/zod-openapi'
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
  .openapi('BaseChannel')

export const EmailChannelConfigSchema = z
  .object({
    destination: z.string().email().openapi({ example: 'email@example.com' }),
  })
  .openapi('EmailChannelConfigSchema')

export const EmailChannelSchema = BaseChannel.extend({
  config: EmailChannelConfigSchema,
  type: z.literal('email').openapi({ example: 'email' }),
}).openapi('EmailChannelSchema')

export const PhoneChannelConfigSchema = z
  .object({
    destination: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/, {
        message: 'Phone number must be in E.164 format (e.g., +1234567890)',
      })
      .openapi({ example: '+18015551234' }),
  })
  .openapi('PhoneChannelConfigSchema')

export const PhoneChannelSchema = BaseChannel.extend({
  config: PhoneChannelConfigSchema,
  type: z.literal('phone').openapi({ example: 'phone' }),
}).openapi('PhoneChannelSchema')

export const SlackChannelConfigSchema = z.object({
  accessToken: z.string().openapi({ example: 'xoxb-...' }),
  channel: z
    .object({
      id: z.string().openapi({ example: 'C00000000' }),
      name: z.string().openapi({ example: 'general' }),
    })
    .optional(),
  destination: z.string().optional().openapi({ example: '#general' }),
  expiresAt: z.coerce
    .date()
    .optional()
    .openapi({ example: '2024-01-01T12:00:00Z' }),
  refreshToken: z.string().optional().openapi({ example: 'xoxe-1-...' }),
  teamId: z.string().openapi({ example: 'T00000000' }),
  tokenRotationEnabled: z.boolean().default(false),
  workspace: z
    .object({
      id: z.string().openapi({ example: 'T00000000' }),
      name: z.string().openapi({ example: 'My Workspace' }),
    })
    .optional(), // For display purposes
})

const SlackChannelSchema = BaseChannel.extend({
  config: SlackChannelConfigSchema,
  type: z.literal('slack').openapi({ example: 'slack' }),
}).openapi('SlackChannelSchema')

export const DiscordChannelConfigSchema = z.object({
  botToken: z.string().openapi({ example: 'MTI3NjE3...' }),
  channel: z
    .object({
      id: z.string().openapi({ example: '1234567890123456789' }),
      name: z.string().openapi({ example: 'general' }),
      type: z.number().openapi({ example: 0 }), // Discord channel type
    })
    .optional(),
  destination: z.string().optional().openapi({ example: '#general' }),
  guild: z
    .object({
      id: z.string().openapi({ example: '1234567890123456789' }),
      name: z.string().openapi({ example: 'My Discord Server' }),
    })
    .optional(), // For display purposes
  guildId: z.string().openapi({ example: '1234567890123456789' }),
})

const DiscordChannelSchema = BaseChannel.extend({
  config: DiscordChannelConfigSchema,
  type: z.literal('discord').openapi({ example: 'discord' }),
}).openapi('DiscordChannelSchema')

const UnknownChannelSchema = BaseChannel.extend({
  config: z.unknown(),
  type: z.string(),
}).openapi('UnknownChannelSchema')

export const ChannelSchema = z.union([
  EmailChannelSchema,
  PhoneChannelSchema,
  SlackChannelSchema,
  DiscordChannelSchema,
  UnknownChannelSchema,
])

const EmailChannelDtoSchema = EmailChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi('EmailChannelDtoSchema')

const PhoneChannelDtoSchema = PhoneChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi('PhoneChannelDtoSchema')

const SlackChannelDtoSchema = SlackChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi('SlackChannelDtoSchema')

const DiscordChannelDtoSchema = DiscordChannelSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
  verified: true,
  verifiedAt: true,
}).openapi('DiscordChannelDtoSchema')

export const ChannelDtoSchema = z
  .union([
    EmailChannelDtoSchema,
    PhoneChannelDtoSchema,
    SlackChannelDtoSchema,
    DiscordChannelDtoSchema,
  ])
  .openapi('ChannelDtoSchema')

export type Channel = z.infer<typeof ChannelSchema>
export type ChannelDto = z.infer<typeof ChannelDtoSchema>

// Extract individual channel config types
export type SlackChannelConfig = z.infer<typeof SlackChannelSchema>['config']
export type EmailChannelConfig = z.infer<typeof EmailChannelSchema>['config']
export type PhoneChannelConfig = z.infer<typeof PhoneChannelSchema>['config']
export type DiscordChannelConfig = z.infer<
  typeof DiscordChannelSchema
>['config']

export const channelsRelations = relations(channels, ({ one, many }) => ({
  subscriptions: many(subscriptions),
  user: one(users, {
    fields: [channels.userId],
    references: [users.id],
  }),
  verifications: many(channelVerifications),
}))
