import { db } from '@everynews/drizzle'
import {
  type Content,
  ContentDtoSchema,
  ContentSchema,
  contents,
} from '@everynews/schema'
import { track } from '@everynews/logs'
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

    if (found) {
      await track({
        channel: 'firecrawl',
        description: `Found cached content for: ${url}`,
        event: 'Content Cache Hit',
        icon: '💾',
        tags: {
          source,
          url,
        },
      })
      return ContentSchema.parse(found)
    }

    await track({
      channel: 'firecrawl',
      description: `Starting Firecrawl for: ${url}`,
      event: 'Crawl Started',
      icon: '🔥',
      tags: {
        source,
        url,
      },
    })

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

    await track({
      channel: 'firecrawl',
      description: `Successfully scraped content from: ${url}`,
      event: 'Content Scraped',
      icon: '📄',
      tags: {
        has_html: String(!!fcResponse.data.html),
        has_markdown: String(!!fcResponse.data.markdown),
        source,
        url,
      },
    })

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
      description: `Stored content and blobs for: ${url}`,
      event: 'Content Stored',
      icon: '✅',
      tags: {
        content_id: content.id,
        source,
        title: content.title,
        url,
      },
    })

    return content
  } catch (error) {
    await track({
      channel: 'firecrawl',
      description: `Firecrawl failed for: ${source}`,
      event: 'Crawl Failed',
      icon: '❌',
      tags: {
        error: String(error),
        url: source,
      },
    })
    console.error(`Error in firecrawl for URL ${source}:`, error)
    throw new Error(`Failed to crawl ${source}: ${String(error)}`)
  }
}
