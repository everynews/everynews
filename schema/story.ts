import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import {
  boolean,
  json,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { alert } from './alert'
import { prompt } from './prompt'
import 'zod-openapi/extend'
import { contents } from './content'
import { LANGUAGE_CODES, LanguageSchema } from './language'

export const stories = pgTable(
  'stories',
  {
    alertId: text('alert_id')
      .notNull()
      .references(() => alert.id, { onDelete: 'cascade' }),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
    id: text('id').primaryKey().$defaultFn(nanoid),
    irrelevant: boolean('irrelevant'),
    keyFindings: json('key_findings'),
    languageCode: text('language_code', { enum: LANGUAGE_CODES })
      .notNull()
      .default('en'),
    promptHash: text('prompt_hash').notNull(),
    promptId: text('prompt_id').references(() => prompt.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    url: text('url').notNull(),
  },
  (table) => ({
    // Unique constraint on URL + promptHash combination
    // This allows multiple stories for the same URL but with different prompt content
    urlPromptHashUnique: unique().on(table.url, table.promptHash),
  }),
)

export const StorySchema = z
  .object({
    alertId: z.coerce.string().openapi({ example: 'alert123' }),
    contentId: z.coerce.string().openapi({ example: 'content123' }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    deletedAt: z.date().nullable().openapi({ example: null }),
    id: z.coerce.string().openapi({ example: '123' }),
    irrelevant: z.boolean().nullable().openapi({ example: false }),
    keyFindings: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ['Key finding 1', 'Key finding 2', 'Key finding 3'],
      }),
    languageCode: LanguageSchema,
    promptHash: z.string().openapi({ example: 'hash123' }),
    promptId: z.coerce.string().nullable().openapi({ example: 'prompt123' }),
    title: z.string().openapi({ example: 'Title' }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    url: z.string().openapi({ example: 'https://example.com' }),
  })
  .openapi({ ref: 'StorySchema' })

export const StoryDtoSchema = StorySchema.omit({
  alertId: true,
  contentId: true,
  createdAt: true,
  deletedAt: true,
  id: true,
  irrelevant: true,
  promptId: true,
  updatedAt: true,
}).openapi({ ref: 'StoryDtoSchema' })

export type Story = z.infer<typeof StorySchema>

export type StoryDto = z.infer<typeof StoryDtoSchema>
