import { boolean, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const news = pgTable('news', {
  createdAt: timestamp('created_at').notNull(),
  id: text('id').primaryKey(),
  isActive: boolean('is_active').notNull().default(true),
  lastRun: timestamp('last_run'),
  lastSent: timestamp('last_sent'),
  name: text('name').notNull(),
  nextRun: timestamp('next_run'),
  strategy: json('strategy').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  waitSettings: json('wait_settings').notNull(),
})

export const schedules = pgTable('schedules', {
  createdAt: timestamp('created_at').notNull(),
  cronExpr: text('cron_expr').notNull(),
  errorDetails: json('error_details'),
  id: text('id').primaryKey(),
  isActive: boolean('is_active').notNull().default(true),
  lastFailure: timestamp('last_failure'),
  lastSuccess: timestamp('last_success'),
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }),
  updatedAt: timestamp('updated_at').notNull(),
})

export const stories = pgTable('stories', {
  createdAt: timestamp('created_at').notNull(),
  foundAt: timestamp('found_at').notNull(),
  id: text('id').primaryKey(),
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }), // For deduplication
  snippet: text('snippet'),
  title: text('title').notNull(), // Queued for delivery
  url: text('url').notNull().unique(),
  wasDelivered: boolean('was_delivered').notNull().default(false),
})

export const channels = pgTable('channels', {
  config: json('config').notNull(),
  createdAt: timestamp('created_at').notNull(), // email, slack, etc
  id: text('id').primaryKey(), // Channel-specific configuration
  isActive: boolean('is_active').notNull().default(true),
  type: text('type').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})
