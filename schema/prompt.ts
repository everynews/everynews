import { z } from 'zod'
import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user'

export const prompt = pgTable('prompt', {
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  id: text('id').primaryKey().$defaultFn(nanoid),
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
    deletedAt: z.coerce.date().nullable().openapi({ example: null }),
    id: z.coerce.string().openapi({ example: '123' }),
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
  deletedAt: true,
  id: true,
  updatedAt: true,
  userId: true,
})

export type Prompt = z.infer<typeof PromptSchema>
export type PromptDto = z.infer<typeof PromptDtoSchema>
