import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import 'zod-openapi/extend'

export const contents = pgTable('contents', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  description: text('description'),
  htmlBlobUrl: text('html_blob_url').notNull(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  markdownBlobUrl: text('markdown_blob_url').notNull(),
  title: text('title').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  url: text('url').notNull().unique(),
})

export const ContentSchema = z
  .object({
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    description: z.string().nullish().openapi({ example: 'Description' }),
    htmlBlobUrl: z.string().openapi({ example: 'articles/example.com.html' }),
    id: z.coerce.string().openapi({ example: '123' }),
    markdownBlobUrl: z.string().openapi({ example: 'articles/example.com.md' }),
    title: z.string().openapi({ example: 'Title' }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    url: z.string().openapi({ example: 'https://example.com' }),
  })
  .openapi({ ref: 'ContentSchema' })

export const ContentDtoSchema = ContentSchema.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
}).openapi({ ref: 'ContentDtoSchema' })

export type Content = z.infer<typeof ContentSchema>

export type ContentDto = z.infer<typeof ContentDtoSchema>
