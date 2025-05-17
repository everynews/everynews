import { nanoid } from '@everynews/lib/id'
import { boolean, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth-schema'

const common = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}

export const news = pgTable('news', {
  ...common,
  active: boolean('active').notNull().default(true),
  isPublic: boolean('is_public').notNull().default(true),
  lastRun: timestamp('last_run').defaultNow(),
  name: text('name').notNull(),
  nextRun: timestamp('next_run').defaultNow(),
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

export const subscriptions = pgTable('subscriptions', {
  ...common,
  newsId: text('news_id')
    .notNull()
    .references(() => news.id, { onDelete: 'cascade' }),
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const channels = pgTable('channels', {
  ...common,
  config: json('config').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})
