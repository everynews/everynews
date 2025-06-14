import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { json, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { newsletter } from './newsletter'
import { prompt } from './prompt'
import 'zod-openapi/extend'
import { contents } from './content'

export const stories = pgTable('stories', {
  contentId: text('content_id')
    .notNull()
    .references(() => contents.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  keyFindings: json('key_findings'),
  newsletterId: text('newsletter_id')
    .notNull()
    .references(() => newsletter.id, { onDelete: 'cascade' }),
  promptId: text('prompt_id').references(() => prompt.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  url: text('url').notNull(),
}, (table) => ({
  // Unique constraint on URL + promptId combination
  // This allows multiple stories for the same URL but with different prompts
  urlPromptUnique: unique().on(table.url, table.promptId),
}))

export const StorySchema = z
  .object({
    contentId: z.coerce.string().openapi({ example: 'content123' }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    id: z.coerce.string().openapi({ example: '123' }),
    keyFindings: z
      .array(z.string())
      .nullable()
      .openapi({
        example: ['Key finding 1', 'Key finding 2', 'Key finding 3'],
      }),
    newsletterId: z.coerce.string().openapi({ example: 'news123' }),
    promptId: z.coerce.string().nullable().openapi({ example: 'prompt123' }),
    title: z.string().openapi({ example: 'Title' }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    url: z.string().openapi({ example: 'https://example.com' }),
  })
  .openapi({ ref: 'StorySchema' })

export const StoryDtoSchema = StorySchema.omit({
  contentId: true,
  createdAt: true,
  id: true,
  newsletterId: true,
  promptId: true,
  updatedAt: true,
}).openapi({ ref: 'StoryDtoSchema' })

export type Story = z.infer<typeof StorySchema>

export type StoryDto = z.infer<typeof StoryDtoSchema>
