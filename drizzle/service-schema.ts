import { boolean, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth-schema'

const common = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}

export const news = pgTable('news', {
  ...common,
  active: boolean('active').notNull().default(true),
  lastRun: timestamp('last_run').defaultNow(),
  name: text('name').notNull(),
  nextRun: timestamp('next_run').defaultNow(),
  public: boolean('public').notNull().default(true),
  strategy: json('strategy').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  wait: json('wait').notNull(),
})

export const stories = pgTable('stories', {
  ...common,
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }),
  snippet: text('snippet'),
  title: text('title').notNull(),
  url: text('url').notNull().unique(),
})

export const channels = pgTable('channels', {
  ...common,
  config: json('config').notNull(),
  type: text('type').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})
