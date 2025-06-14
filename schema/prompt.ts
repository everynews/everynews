import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user'

export const SUPPORTED_LANGUAGES = [
  'en',
  'ko', 
  'ja',
  'zh-Hans',
  'zh-Hant',
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'en': 'English',
  'ko': '한국어',
  'ja': '日本語', 
  'zh-Hans': '简体中文',
  'zh-Hant': '繁體中文',
}

export const prompt = pgTable('prompt', {
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  language: text('language').notNull().default('en'),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const PromptSchema = z
  .object({
    content: z.coerce
      .string()
      .min(1, 'Content is required')
      .openapi({ example: 'Custom prompt instructions...' }),
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    id: z.coerce.string().openapi({ example: '123' }),
    language: z.enum(SUPPORTED_LANGUAGES).openapi({ example: 'en' }),
    name: z.coerce
      .string()
      .min(1, 'Name is required')
      .openapi({ example: 'My Custom Prompt' }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    userId: z.coerce.string().openapi({ example: '123' }),
  })
  .openapi({ ref: 'Prompt' })

export const PromptDtoSchema = PromptSchema.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
  userId: true,
})

export type Prompt = z.infer<typeof PromptSchema>
export type PromptDto = z.infer<typeof PromptDtoSchema>
