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
import { alerts } from './alert'
import { prompt } from './prompt'
import 'zod-openapi/extend'
import { contents } from './content'
import { LANGUAGE_CODES, LanguageSchema } from './language'

export const stories = pgTable(
  'stories',
  {
    alertId: text('alert_id')
      .notNull()
      .references(() => alerts.id, { onDelete: 'cascade' }),
    contentId: text('content_id')
      .notNull()
      .references(() => contents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
    id: text('id').primaryKey().$defaultFn(nanoid),
    keyFindings: json('key_findings'),
    languageCode: text('language_code', { enum: LANGUAGE_CODES })
      .notNull()
      .default('en'),
    originalUrl: text('original_url').notNull(),
    promptHash: text('prompt_hash').notNull(),
    promptId: text('prompt_id').references(() => prompt.id, {
      onDelete: 'set null',
    }),
    systemMarkedIrrelevant: boolean('system_marked_irrelevant').default(false),
    title: text('title').notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    url: text('url').notNull(),
    userMarkedIrrelevant: boolean('user_marked_irrelevant').default(false),
  },
  (table) => ({
    // Unique constraint on URL + promptHash + languageCode combination
    // This allows multiple stories for the same URL with different prompts or languages
    urlPromptHashLangUnique: unique().on(
      table.url,
      table.promptHash,
      table.languageCode,
    ),
  }),
)

export const StorySchema = z
  .object({
    alertId: z.coerce.string().openapi({ example: 'alert123' }),
    contentId: z.coerce.string().openapi({ example: 'content123' }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    deletedAt: z.date().nullable().openapi({ example: null }),
    id: z.coerce.string().openapi({ example: '123' }),
    keyFindings: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ['Key finding 1', 'Key finding 2', 'Key finding 3'],
      }),
    languageCode: LanguageSchema,
    originalUrl: z.string().openapi({ example: 'https://example.com' }),
    promptHash: z.string().openapi({ example: 'hash123' }),
    promptId: z.coerce.string().nullable().openapi({ example: 'prompt123' }),
    systemMarkedIrrelevant: z.boolean().openapi({ example: false }),
    title: z.string().openapi({ example: 'Title' }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    url: z.string().openapi({ example: 'https://example.com' }),
    userMarkedIrrelevant: z.boolean().openapi({ example: false }),
  })
  .openapi({ ref: 'StorySchema' })

export const StoryDtoSchema = StorySchema.omit({
  alertId: true,
  contentId: true,
  createdAt: true,
  deletedAt: true,
  id: true,
  promptId: true,
  systemMarkedIrrelevant: true,
  updatedAt: true,
  userMarkedIrrelevant: true,
}).openapi({ ref: 'StoryDtoSchema' })

export type Story = z.infer<typeof StorySchema>

export type StoryDto = z.infer<typeof StoryDtoSchema>
