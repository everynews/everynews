import 'zod-openapi/extend'
import { nanoid } from '@everynews/lib/id'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import 'zod-openapi/extend'

export const contents = pgTable('contents', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: text('id').primaryKey().$defaultFn(nanoid),
  title: text('title'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  url: text('url').notNull().unique(),
  description: text('description'),
  language: text('language'),
  keywords: text('keywords'),
  robots: text('robots'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogUrl: text('og_url'),
  ogImage: text('og_image'),
  ogLocaleAlternate: text('og_locale_alternate').array(),
  ogSiteName: text('og_site_name'),
})

export const ContentSchema = z
  .object({
    createdAt: z.coerce.date().openapi({ example: new Date() }),
    id: z.coerce.string().openapi({ example: '123' }),
    title: z.string().openapi({ example: 'Title' }),
    updatedAt: z.coerce.date().openapi({ example: new Date() }),
    url: z.string().openapi({ example: 'https://example.com' }),
    description: z.string().nullable().openapi({ example: 'Description' }),
    language: z.string().nullable().openapi({ example: 'en' }),
    keywords: z.string().nullable().openapi({ example: 'keywords' }),
    robots: z.string().nullable().openapi({ example: 'robots' }),
    ogTitle: z.string().nullable().openapi({ example: 'og_title' }),
    ogDescription: z.string().nullable().openapi({ example: 'og_description' }),
    ogUrl: z.string().nullable().openapi({ example: 'og_url' }),
    ogImage: z.string().nullable().openapi({ example: 'og_image' }),
    ogLocaleAlternate: z.string().array().nullable().openapi({ example: ['og_locale_alternate'] }),
    ogSiteName: z.string().nullable().openapi({ example: 'og_site_name' }),
  })
  .openapi({ ref: 'ContentSchema' })

export const ContentDtoSchema = ContentSchema.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
}).openapi({ ref: 'ContentDtoSchema' })

export type Content = z.infer<typeof ContentSchema>

export type ContentDto = z.infer<typeof ContentDtoSchema>
