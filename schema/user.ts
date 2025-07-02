import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import 'zod-openapi/extend'
import { accounts } from './account'
import { alerts } from './alert'
import { channels } from './channel'
import { prompt } from './prompt'
import { sessions } from './session'
import { subscriptions } from './subscription'

export const users = pgTable('users', {
  createdAt: timestamp('created_at').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  id: text('id').primaryKey(),
  image: text('image'),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').unique(),
  phoneNumberVerified: boolean('phone_number_verified'),
  updatedAt: timestamp('updated_at').notNull(),
})

export const UserSchema = z
  .object({
    createdAt: z.coerce.date(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    id: z.string(),
    image: z.string().nullable(),
    name: z.string(),
    phoneNumber: z.string().nullable(),
    phoneNumberVerified: z.boolean().nullable(),
    updatedAt: z.coerce.date(),
  })
  .openapi({ ref: 'UserSchema' })

export type User = z.infer<typeof UserSchema>

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  alerts: many(alerts),
  channels: many(channels),
  prompts: many(prompt),
  sessions: many(sessions),
  subscriptions: many(subscriptions),
}))
