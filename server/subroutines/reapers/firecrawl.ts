import { db } from '@everynews/drizzle'
import { type ContentDto, ContentDtoSchema, contents } from '@everynews/schema'
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
        description: z.string().optional(),
        keywords: z.string().optional(),
        language: z.union([z.string(), z.array(z.string())]).optional(),
        ogDescription: z.string().optional(),
        ogImage: z.string().optional(),
        ogLocaleAlternate: z.string().optional(),
        ogSiteName: z.string().optional(),
        ogTitle: z.string().optional(),
        ogUrl: z.string().optional(),
        robots: z.union([z.string(), z.array(z.string())]).optional(),
        sourceURL: z.string().optional(),
        statusCode: z.number().optional(),
        title: z.string().optional(),
      })
      .optional(),
  }),
  success: z.boolean(),
})

export type FirecrawlResponse = z.infer<typeof FirecrawlResponseSchema>

export const firecrawl = async (source: string): Promise<ContentDto> => {
  try {
    const url = normalizeUrl(source, {
      stripProtocol: true,
      stripWWW: true,
    })

    const found = await db.query.contents.findFirst({
      where: eq(contents.url, url),
    })

    if (found) return ContentDtoSchema.parse(found)

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

    const content = ContentDtoSchema.parse({
      ...fcResponse.data.metadata,
      htmlBlobUrl,
      markdownBlobUrl,
      title:
        fcResponse.data.metadata?.title ||
        fcResponse.data.metadata?.ogTitle ||
        url,
      url,
      language: Array.isArray(fcResponse.data.metadata?.language)
        ? fcResponse.data.metadata?.language
        : [fcResponse.data.metadata?.language || 'en'],
      robots: Array.isArray(fcResponse.data.metadata?.robots)
        ? fcResponse.data.metadata?.robots
        : [fcResponse.data.metadata?.robots || 'en'],
    })

    await db.insert(contents).values(content).execute()

    return content
  } catch (error) {
    console.error(`Error in firecrawl for URL ${source}:`, error)
    throw new Error(`Failed to crawl ${source}: ${String(error)}`)
  }
}
