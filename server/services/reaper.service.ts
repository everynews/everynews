import { db } from '@everynews/drizzle'
import { type ContentDto, ContentDtoSchema, contents } from '@everynews/schema'
import FirecrawlApp from '@mendable/firecrawl-js'
import { put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'

import { z } from 'zod'

export const FirecrawlResponseSchema = z.object({
  data: z.object({
    html: z.string(),
    markdown: z.string(),
    metadata: z.object({
      description: z.string(),
      keywords: z.string(),
      language: z.string(),
      ogDescription: z.string(),
      ogImage: z.string(),
      ogLocaleAlternate: z.array(z.string()),
      ogSiteName: z.string(),
      ogTitle: z.string(),
      ogUrl: z.string(),
      robots: z.string(),
      sourceURL: z.string(),
      statusCode: z.number(),
      title: z.string(),
    }),
  }),
  success: z.boolean(),
})

export class ReaperService {
  private static instance: ReaperService
  private scraper: FirecrawlApp

  private constructor() {
    this.scraper = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    })
  }

  public static get(): ReaperService {
    if (!ReaperService.instance) {
      ReaperService.instance = new ReaperService()
    }
    return ReaperService.instance
  }

  async checkDuplicate(url: string): Promise<ContentDto | null> {
    const found = await db.query.contents.findFirst({
      where: eq(contents.url, url),
    })
    return found ? ContentDtoSchema.parse(found) : null
  }

  async reap(url: string): Promise<ContentDto> {
    // Normalize the URL
    const normalizedUrl = normalizeUrl(url)

    // Check if the content already exists
    const found = await this.checkDuplicate(normalizedUrl)
    if (found) {
      return found
    }

    // If not, scrape the content
    const response = await FirecrawlResponseSchema.parse(
      this.scraper.scrapeUrl(normalizedUrl, { formats: ['markdown', 'html'] }),
    )
    if (!response.success) {
      throw new Error('Failed to scrape')
    }

    // Upload the content to Blob
    const { url: markdownBlobUrl } = await put(
      `${normalizedUrl}.md`,
      response.data.markdown || '',
      { access: 'public' },
    )
    const { url: htmlBlobUrl } = await put(
      `${normalizedUrl}.html`,
      response.data.html || '',
      { access: 'public' },
    )

    // Return the content
    return {
      htmlBlobUrl,
      markdownBlobUrl,
      ...response.data.metadata,
      url: normalizedUrl,
    }
  }

  async run(urls: string[]): Promise<ContentDto[]> {
    return Promise.all(urls.map(this.reap))
  }
}
