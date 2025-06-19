import { db } from '@everynews/database'
import { markdownify } from '@everynews/lib/dom'
import { track } from '@everynews/logs'
import type { Content } from '@everynews/schema'
import { ContentSchema, contents } from '@everynews/schema'
import { brightdata } from '@everynews/subroutines/reapers/brightdata'
import { put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { JSDOM } from 'jsdom'
import normalizeUrl from 'normalize-url'

export const reap = async (url: string): Promise<Content> => {
  try {
    const normalized = normalizeUrl(url, {
      stripProtocol: true,
      stripWWW: true,
    })

    await track({
      channel: 'brightdata',
      description: normalized,
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

    const dom = await JSDOM.fromURL(url)
    const title = dom.window.document.title

    let markdown = await markdownify(url, dom)

    if (!markdown) {
      const html = await brightdata(url)
      markdown = await markdownify(url, html)

      if (!markdown) {
        throw new Error('Failed to extract content from BrightData')
      }
    }

    const [htmlBlob, markdownBlob] = await Promise.all([
      put(`brightdata/${normalized}.html`, dom.window.document.body.innerHTML, {
        access: 'public',
        allowOverwrite: true,
        contentType: 'text/html',
      }),
      put(`brightdata/${normalized}.md`, markdown, {
        access: 'public',
        allowOverwrite: true,
        contentType: 'text/markdown',
      }),
    ])

    const [content] = ContentSchema.array().parse(
      await db
        .insert(contents)
        .values({
          htmlBlobUrl: htmlBlob.url,
          markdownBlobUrl: markdownBlob.url,
          originalUrl: url,
          title,
          url: normalized,
        })
        .returning(),
    )

    await track({
      channel: 'brightdata',
      description: url,
      event: `Scraped ${content.title}`.slice(0, 160),
      icon: '✅',
      tags: {
        content_id: content.id,
        htmlBlobUrl: htmlBlob.url,
        markdownBlobUrl: markdownBlob.url,
        title: content.title,
        type: 'info',
        url,
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
