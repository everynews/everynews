import { db } from '@everynews/drizzle'
import { track } from '@everynews/logs'
import {
  type Content,
  ContentDtoSchema,
  ContentSchema,
  contents,
} from '@everynews/schema'
import { put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import z from 'zod'

export const FirecrawlResponseSchema = z.object({
  data: z.object({
    html: z.string().optional(),
    markdown: z.string().optional(),
    metadata: z
      .object({
        ogTitle: z.string().optional(),
        title: z.string().optional(),
      })
      .optional(),
  }),
  success: z.boolean(),
})

export type FirecrawlResponse = z.infer<typeof FirecrawlResponseSchema>

export const firecrawl = async (source: string): Promise<Content> => {
  try {
    const url = normalizeUrl(source, {
      stripProtocol: true,
      stripWWW: true,
    })

    const found = await db.query.contents.findFirst({
      where: eq(contents.url, url),
    })

    if (found) return ContentSchema.parse(found)

    const options = {
      body: JSON.stringify({
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        url,
      }),
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', options)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    const fcResponse = FirecrawlResponseSchema.parse(data)

    const [{ url: markdownBlobUrl }, { url: htmlBlobUrl }] = await Promise.all([
      put(`${url}.md`, fcResponse.data.markdown || '', {
        access: 'public',
        allowOverwrite: true,
      }),
      put(`${url}.html`, fcResponse.data.html || '', {
        access: 'public',
        allowOverwrite: true,
      }),
    ])

    const toInsert = ContentDtoSchema.parse({
      htmlBlobUrl,
      markdownBlobUrl,
      title:
        fcResponse.data.metadata?.title ||
        fcResponse.data.metadata?.ogTitle ||
        url,
      url,
    })

    const [content] = await db.insert(contents).values(toInsert).returning()

    await track({
      channel: 'firecrawl',
      description: url,
      event: `Firecrawled ${url}`,
      icon: '✅',
      tags: {
        content_id: content.id,
        htmlBlobUrl,
        markdownBlobUrl,
        source,
        title: content.title,
        type: 'info',
        url,
      },
    })
    return content
  } catch (error) {
    await track({
      channel: 'firecrawl',
      description: source,
      event: `Firecrawl Failed ${source}`,
      icon: '❌',
      tags: {
        error: String(error),
        source,
        type: 'error',
      },
    })
    console.error(`Error in firecrawl for URL ${source}:`, error)
    throw new Error(`Failed to crawl ${source}: ${String(error)}`)
  }
}
