import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import 'zod-openapi/extend'

export const contents = pgTable('contents', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  description: text('description'),
  id: text('id').primaryKey().$defaultFn(nanoid),
  keywords: text('keywords'),
  language: text('language'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  ogLocaleAlternate: text('og_locale_alternate').array(),
  ogSiteName: text('og_site_name'),
  ogTitle: text('og_title'),
  ogUrl: text('og_url'),
  robots: text('robots'),
  title: text('title'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  url: text('url').notNull().unique(),
})

export const ContentSchema = z
  .object({
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    description: z.string().nullable().openapi({ example: 'Description' }),
    id: z.coerce.string().openapi({ example: '123' }),
    keywords: z.string().nullable().openapi({ example: 'keywords' }),
    language: z.string().nullable().openapi({ example: 'en' }),
    ogDescription: z.string().nullable().openapi({ example: 'og_description' }),
    ogImage: z.string().nullable().openapi({ example: 'og_image' }),
    ogLocaleAlternate: z
      .string()
      .array()
      .nullable()
      .openapi({ example: ['og_locale_alternate'] }),
    ogSiteName: z.string().nullable().openapi({ example: 'og_site_name' }),
    ogTitle: z.string().nullable().openapi({ example: 'og_title' }),
    ogUrl: z.string().nullable().openapi({ example: 'og_url' }),
    robots: z.string().nullable().openapi({ example: 'robots' }),
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
