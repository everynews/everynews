import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { boolean, json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { strategySchema } from './strategy'
import { users } from './user'
import { WaitSchema } from './wait'

export const news = pgTable('news', {
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  isPublic: boolean('is_public').notNull().default(true),
  lastRun: timestamp('last_run').defaultNow(),
  name: text('name').notNull(),
  nextRun: timestamp('next_run').defaultNow(),
  strategy: json('strategy').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  wait: json('wait').notNull(),
})

export const NewsSchema = z
  .object({
    active: z.coerce.boolean().openapi({ example: true }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    id: z.coerce.string().openapi({ example: '123' }),
    isPublic: z.coerce.boolean().openapi({ example: true }),
    lastRun: z.coerce.date().nullable().openapi({ example: new Date() }),
    name: z.coerce
      .string()
      .min(1, 'Name is required')
      .openapi({ example: 'News' }),
    nextRun: z.coerce.date().nullable().openapi({ example: new Date() }),
    strategy: strategySchema,
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    userId: z.coerce.string().openapi({ example: '123' }),
    wait: WaitSchema,
  })
  .openapi({ ref: 'News' })

export const NewsDtoSchema = NewsSchema.omit({
  createdAt: true,
  id: true,
  lastRun: true,
  nextRun: true,
  updatedAt: true,
  userId: true,
})

export type News = z.infer<typeof NewsSchema>
export type NewsDto = z.infer<typeof NewsDtoSchema>
