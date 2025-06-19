import { nanoid } from '@everynews/lib/id'
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { z } from 'zod'
import 'zod-openapi/extend'
import { LANGUAGE_CODES, LanguageCodeSchema } from './language'
import { prompt } from './prompt'
import { strategySchema } from './strategy'
import { users } from './user'
import { WaitSchema } from './wait'

export const alerts = pgTable(
  'alerts',
  {
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
    description: text('description'),
    id: text('id').primaryKey().$defaultFn(nanoid),
    isPublic: boolean('is_public').notNull().default(true),
    language: text('language', { enum: LANGUAGE_CODES })
      .notNull()
      .default('en'),
    lastRun: timestamp('last_run').defaultNow(),
    name: text('name').notNull(),
    nextRun: timestamp('next_run').defaultNow(),
    promptId: text('prompt_id').references(() => prompt.id, {
      onDelete: 'set null',
    }),
    strategy: json('strategy').notNull(),
    threshold: integer('threshold').notNull().default(70),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    wait: json('wait').notNull(),
  },
  (table) => ({
    userIdDeletedAtIdx: index('alerts_user_id_deleted_at_idx').on(
      table.userId,
      table.deletedAt,
    ),
  }),
)

export const AlertSchema = z
  .object({
    active: z.coerce.boolean().openapi({ example: true }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    deletedAt: z.coerce.date().nullable().openapi({ example: null }),
    description: z.coerce
      .string()
      .nullable()
      .openapi({ example: 'A brief description of the alert' }),
    id: z.coerce.string().openapi({ example: '123' }),
    isPublic: z.coerce.boolean().openapi({ example: true }),
    languageCode: LanguageCodeSchema,
    lastRun: z.coerce.date().nullable().openapi({ example: new Date() }),
    name: z.coerce
      .string()
      .min(1, 'Name is required')
      .openapi({ example: 'News' }),
    nextRun: z.coerce.date().nullable().openapi({ example: new Date() }),
    promptId: z.coerce.string().nullable().openapi({ example: '123' }),
    strategy: strategySchema,
    threshold: z.coerce.number().int().min(0).max(100).openapi({ example: 70 }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    userId: z.coerce.string().openapi({ example: '123' }),
    wait: WaitSchema,
  })
  .openapi({ ref: 'Alert' })

export const AlertDtoSchema = AlertSchema.omit({
  createdAt: true,
  deletedAt: true,
  id: true,
  lastRun: true,
  nextRun: true,
  updatedAt: true,
  userId: true,
})

export type Alert = z.infer<typeof AlertSchema>
export type AlertDto = z.infer<typeof AlertDtoSchema>
