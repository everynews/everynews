import 'zod-openapi/extend'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const verifications = pgTable('verifications', {
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  expiresAt: timestamp('expires_at').notNull(),
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
  value: text('value').notNull(),
})
