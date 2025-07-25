import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import 'zod-openapi/extend'
import { alerts } from './alert'
import { channels } from './channel'
import { prompt } from './prompt'
import { sessions } from './session'
import { subscriptions } from './subscription'

export const users = pgTable('users', {
  banExpires: timestamp('ban_expires'),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  id: text('id').primaryKey(),
  image: text('image'),
  name: text('name').notNull(),
  role: text('role'),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
})

export const UserSchema = z
  .object({
    createdAt: z.coerce.date(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    id: z.string(),
    image: z.string().nullable(),
    name: z.string(),
    updatedAt: z.coerce.date(),
  })
  .openapi({ ref: 'UserSchema' })

export type User = z.infer<typeof UserSchema>

export const usersRelations = relations(users, ({ many }) => ({
  alerts: many(alerts),
  channels: many(channels),
  prompts: many(prompt),
  sessions: many(sessions),
  subscriptions: many(subscriptions),
}))
