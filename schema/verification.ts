import 'zod-openapi/extend'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const verifications = pgTable('verifications', {
  createdAt: timestamp('created_at'),
  expiresAt: timestamp('expires_at').notNull(),
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  updatedAt: timestamp('updated_at'),
  value: text('value').notNull(),
})
