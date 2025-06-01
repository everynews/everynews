import { db } from '@everynews/drizzle'
import { type ContentDto, ContentDtoSchema, contents } from '@everynews/schema'
import { put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import { z } from 'zod'
import { SageService } from './sage.service'

if (!process.env.FIRECRAWL_API_KEY) {
  throw new Error('FIRECRAWL_API_KEY is not defined')
}

export interface ReapingJob {
  urls: string[]
  newsId: string
  id?: string
}

export const FirecrawlResponseSchema = z
  .object({
    data: z
      .object({
        html: z.string().optional(),
        markdown: z.string().optional(),
        metadata: z
          .object({
            description: z.string().optional(),
            keywords: z.string().optional(),
            language: z.string().optional(),
            ogDescription: z.string().optional(),
            ogImage: z.string().optional(),
            ogLocaleAlternate: z.string().optional(),
            ogSiteName: z.string().optional(),
            ogTitle: z.string().optional(),
            ogUrl: z.string().optional(),
            robots: z.string().optional(),
            sourceURL: z.string().optional(),
            statusCode: z.number().optional(),
            title: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    success: z.boolean(),
  })
  .optional()

export class ReaperService {
  private static instance: ReaperService
  private readonly apiKey: string

  // Queue functionality
  private readonly pending: ReapingJob[] = []
  private running = 0
  private readonly concurrency = 4
  private lastProcessTime = 0
  private readonly rateLimit = 10000 // 10 seconds between operations

  private constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || ''
  }

  public static get(): ReaperService {
    if (!ReaperService.instance) {
      ReaperService.instance = new ReaperService()
    }
    return ReaperService.instance
  }

  /** Add URLs to the processing queue */
  async enqueue(urls: string[], newsId: string): Promise<void> {
    this.pending.push({ newsId, urls })
    this.schedule()
  }

  /** Try to keep the processing pipeline full */
  private schedule(): void {
    if (this.running < this.concurrency && this.pending.length) {
      const now = Date.now()
      const timeSinceLastProcess = now - this.lastProcessTime

      if (timeSinceLastProcess >= this.rateLimit) {
        const job = this.pending.shift() as ReapingJob
        this.running++
        this.lastProcessTime = now
        void this.processJob(job)
      } else {
        // Schedule next check after rate limit expires
        const delay = this.rateLimit - timeSinceLastProcess
        setTimeout(() => this.schedule(), delay)
      }
    }
  }

  /** Process a reaping job with error handling and persistence */
  private async processJob(job: ReapingJob): Promise<void> {
    try {
      const content: ContentDto[] = await this.run(job.urls)
      const insertResult = await db
        .insert(contents)
        .values(content)
        .returning({ id: contents.id })
        .execute()

      // Forward to SageService for story creation
      for (let i = 0; i < insertResult.length; i++) {
        const contentId = insertResult[i].id
        const contentDto = content[i]
        await SageService.get().enqueue(contentId, job.newsId, contentDto)
      }
    } catch (err) {
      console.error('ReaperService job failed', err)
    } finally {
      this.running--
      // Schedule next job after rate limit delay
      setTimeout(() => this.schedule(), this.rateLimit)
    }
  }

  static async checkDuplicate(url: string): Promise<ContentDto | null> {
    const found = await db.query.contents.findFirst({
      where: eq(contents.url, url),
    })
    return found ? ContentDtoSchema.parse(found) : null
  }

  async reap(url: string): Promise<ContentDto> {
    // Normalize the URL
    const normalizedUrl = normalizeUrl(url)

    // Check if the content already exists
    const found = await ReaperService.checkDuplicate(normalizedUrl)
    if (found) {
      return found
    }

    // If not, scrape the content
    console.log('Scraping', normalizedUrl)

    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        body: JSON.stringify({
          formats: ['markdown', 'html'],
          url: normalizedUrl,
        }),
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(
          `Firecrawl API error: ${response.status} ${response.statusText}`,
        )
      }

      const data = await response.json()
      const parsed = FirecrawlResponseSchema.parse(data)

      if (!parsed?.success || !parsed.data) {
        throw new Error('Failed to scrape - API returned unsuccessful result')
      }

      // Upload the content to Blob
      const { url: markdownBlobUrl } = await put(
        `${normalizedUrl}.md`,
        parsed.data.markdown || '',
        { access: 'public' },
      )
      const { url: htmlBlobUrl } = await put(
        `${normalizedUrl}.html`,
        parsed.data.html || '',
        { access: 'public' },
      )

      // Return the content
      return {
        description: parsed.data.metadata?.description || null,
        htmlBlobUrl,
        keywords: parsed.data.metadata?.keywords || null,
        language: parsed.data.metadata?.language || null,
        markdownBlobUrl,
        ogDescription: parsed.data.metadata?.ogDescription || null,
        ogImage: parsed.data.metadata?.ogImage || null,
        ogLocaleAlternate: parsed.data.metadata?.ogLocaleAlternate || null,
        ogSiteName: parsed.data.metadata?.ogSiteName || null,
        ogTitle: parsed.data.metadata?.ogTitle || null,
        ogUrl: parsed.data.metadata?.ogUrl || null,
        robots: parsed.data.metadata?.robots || null,
        title: parsed.data.metadata?.title || '',
        url: normalizedUrl,
      }
    } catch (error) {
      console.error(`Failed to scrape ${normalizedUrl}`, error)
      throw error
    }
  }

  async run(urls: string[]): Promise<ContentDto[]> {
    return Promise.all(urls.map(this.reap))
  }
}
