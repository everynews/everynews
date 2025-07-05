import { nanoid } from '@everynews/lib/id'
import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import 'zod-openapi/extend'
import { channels } from './channel'

export const channelVerifications = pgTable('channel_verifications', {
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  token: text('token').notNull().unique(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  used: boolean('used').notNull().default(false),
})

export const ChannelVerificationSchema = z
  .object({
    channelId: z.string(),
    createdAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
    id: z.string(),
    token: z.string(),
    updatedAt: z.coerce.date(),
    used: z.boolean(),
  })
  .openapi({ ref: 'ChannelVerificationSchema' })

export type ChannelVerification = z.infer<typeof ChannelVerificationSchema>

export const channelVerificationsRelations = relations(
  channelVerifications,
  ({ one }) => ({
    channel: one(channels, {
      fields: [channelVerifications.channelId],
      references: [channels.id],
    }),
  }),
)
