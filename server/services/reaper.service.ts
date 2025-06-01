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

  private readonly pending: ReapingJob[] = []
  private running = false
  /** Minimum interval (ms) between Firecrawl requests */
  private readonly rateLimit = 10_000
  /** Timestamp when the next request may start */
  private nextAllowed = Date.now()

  private constructor() {
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not defined')
    }
    this.apiKey = process.env.FIRECRAWL_API_KEY
  }

  public static get(): ReaperService {
    if (!ReaperService.instance) {
      ReaperService.instance = new ReaperService()
    }
    return ReaperService.instance
  }

  async enqueue(urls: string[], newsId: string): Promise<void> {
    this.pending.push({ newsId, urls })
    this.schedule()
  }

  /** Dispatcher: pulls the next job when not running and the rate-limit window has passed */
  private schedule = (): void => {
    if (this.running || this.pending.length === 0) return

    const now = Date.now()
    const wait = this.nextAllowed - now

    if (wait > 0) {
      setTimeout(this.schedule, wait)
      return
    }

    const job = this.pending.shift() as ReapingJob
    this.running = true
    this.nextAllowed = now + this.rateLimit

    void this.processJob(job).finally(() => {
      this.running = false
      this.schedule() // immediately try next item
    })
  }

  private async processJob(job: ReapingJob): Promise<void> {
    try {
      const content: ContentDto[] = await this.run(job.urls)
      const insertResult = await db
        .insert(contents)
        .values(content)
        .returning({ id: contents.id })
        .execute()

      for (let i = 0; i < insertResult.length; i++) {
        const contentId = insertResult[i].id
        const contentDto = content[i]
        await SageService.get().enqueue(contentId, job.newsId, contentDto)
      }
    } catch (err) {
      console.error('ReaperService job failed', err)
    } finally {
      // Job done – dispatcher will decide when the next one starts
    }
  }

  static async checkDuplicate(url: string): Promise<ContentDto | null> {
    const found = await db.query.contents.findFirst({
      where: eq(contents.url, url),
    })
    return found ? ContentDtoSchema.parse(found) : null
  }

  async reap(url: string): Promise<ContentDto> {
    const normalizedUrl = normalizeUrl(url)

    const found = await ReaperService.checkDuplicate(normalizedUrl)
    if (found) {
      return found
    }

    console.log('Scraping', normalizedUrl)

    try {
      let response: Response | null = null
      let attempt = 0
      const maxRetries = 3

      while (attempt < maxRetries) {
        response = await fetch('https://api.firecrawl.dev/v1/scrape', {
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

        if (response.status !== 429) {
          break
        }

        attempt++
        const retryAfterHeader = response.headers.get('Retry-After')
        const retryAfter =
          retryAfterHeader !== null
            ? Number(retryAfterHeader) * 1000
            : this.rateLimit
        console.warn(
          `Firecrawl rate limit hit for ${normalizedUrl}. Retrying in ${retryAfter}ms (attempt ${attempt}/${maxRetries})`,
        )
        await this.sleep(retryAfter)
      }

      if (!response || response.status === 429) {
        throw new Error('Firecrawl API error: 429 Too Many Requests')
      }

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
    const results: ContentDto[] = []
    const interDelay = 500 // slight breathing room inside a batch

    for (const url of urls) {
      try {
        const content = await this.reap(url)
        results.push(content)
        await this.sleep(interDelay)
      } catch (err) {
        console.error('ReaperService failed for URL', url, err)
      }
    }
    return results
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
