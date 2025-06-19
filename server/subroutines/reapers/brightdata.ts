import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import type { Content } from '@everynews/schema'
import { contents } from '@everynews/schema'
import { put } from '@vercel/blob'
import { Defuddle } from 'defuddle/node'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'

export async function brightdata(url: string): Promise<Content> {
  try {
    const normalized = normalizeUrl(url, {
      stripProtocol: true,
      stripWWW: true,
    })

    await track({
      channel: 'brightdata',
      description: url,
      event: 'Scraping URL',
      icon: '🔍',
      tags: {
        type: 'info',
        url,
      },
    })

    const existing = await db.query.contents.findFirst({
      where: eq(contents.url, normalized),
    })

    if (existing) {
      return existing as Content
    }

    const response = await fetch('https://api.brightdata.com/request', {
      body: JSON.stringify({
        format: 'raw',
        url: `https://${normalized}`,
        zone: 'everynews',
      }),
      headers: {
        Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(
        `BrightData API error: ${response.status} ${response.statusText} ${await response.text()}`,
      )
    }

    const html = await response.text()

    // Parse with Defuddle
    const defuddleResult = await Defuddle(html, `https://${normalized}`, {
      markdown: true,
    })

    if (!defuddleResult.content) {
      throw new Error('No content extracted by Defuddle')
    }

    // Store HTML
    const [htmlBlob, markdownBlob] = await Promise.all([
      put(`brightdata/${normalized}.html`, html, {
        access: 'public',
        contentType: 'text/html',
      }),
      put(`brightdata/${normalized}.md`, defuddleResult.content, {
        access: 'public',
        contentType: 'text/markdown',
      }),
    ])

    // Prepare the title
    const title = defuddleResult.title || 'Untitled'

    // Save to database
    const row = {
      htmlBlobUrl: htmlBlob.url,
      markdownBlobUrl: markdownBlob.url,
      title,
      url: normalized,
    }

    const [content] = await db.insert(contents).values(row).returning()

    await track({
      channel: 'brightdata',
      description: url,
      event: `Scraped ${content.title}`.slice(0, 160),
      icon: '✅',
      tags: {
        author: defuddleResult.author,
        content_id: content.id,
        htmlBlobUrl: htmlBlob.url,
        markdownBlobUrl: markdownBlob.url,
        site: defuddleResult.site,
        title: content.title,
        type: 'info',
        url,
        wordCount: defuddleResult.wordCount,
      },
    })

    return content
  } catch (error) {
    await track({
      channel: 'brightdata',
      description: url,
      event: 'Scraping Failed',
      icon: '❌',
      tags: {
        error: String(error),
        type: 'error',
        url,
      },
    })
    throw error
  }
}
