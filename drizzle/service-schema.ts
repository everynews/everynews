import { boolean, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

const common = {
  createdAt: timestamp('created_at').notNull(),
  id: text('id').primaryKey(),
  updatedAt: timestamp('updated_at').notNull(),
}

export const news = pgTable('news', {
  ...common,
  active: boolean('active').notNull().default(true),
  lastRun: timestamp('last_run'),
  name: text('name').notNull(),
  nextRun: timestamp('next_run'),
  strategy: json('strategy').notNull(),
  wait: json('wait').notNull(),
})

export const stories = pgTable('stories', {
  ...common,
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }), // For deduplication
  snippet: text('snippet'),
  title: text('title').notNull(), // Queued for delivery
  url: text('url').notNull().unique(),
})

export const channels = pgTable('channels', {
  ...common,
  config: json('config').notNull(),
  type: text('type').notNull(),
})
