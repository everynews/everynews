import { db } from '@everynews/drizzle'
import { type ContentDto, contents } from '@everynews/schema'
import FirecrawlApp, { type ScrapeResponse } from '@mendable/firecrawl-js'
import { eq } from 'drizzle-orm'

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

export const scrape = async (s: { url: string }) => {
  const existingContent = await db
    .select()
    .from(contents)
    .where(eq(contents.url, s.url))
    .limit(1)

  if (existingContent.length > 0) {
    return existingContent[0]
  }

  const scrapeResult = (await app.scrapeUrl(s.url, {
    formats: ['markdown'],
  })) as ScrapeResponse

  if (!scrapeResult.success) {
    throw new Error(`Failed to scrape: ${scrapeResult.error}`)
  }

  const newContent = await db
    .insert(contents)
    .values({
      title: scrapeResult.metadata?.title,
      url: scrapeResult.metadata?.url ?? s.url,
      ...scrapeResult.metadata,
    } as ContentDto)
    .returning()

  return newContent[0]
}
