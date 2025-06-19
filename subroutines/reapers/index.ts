import { db } from '@everynews/database'
import { markdownify } from '@everynews/lib/dom'
import { track } from '@everynews/logs'
import type { Content } from '@everynews/schema'
import { ContentSchema, contents } from '@everynews/schema'
import {
  brightdataHosted,
  brightdataWss,
} from '@everynews/subroutines/reapers/brightdata'
import { put } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import normalizeUrl from 'normalize-url'
import { chromium } from 'playwright'

export const reap = async (url: string): Promise<Content | null> => {
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

    let html: string = ''
    let title: string = ''
    try {
      const browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(url)
      html = await page.content()
      title = await page.title()
      await browser.close()
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
    }

    if (!html && process.env.BRIGHTDATA_PLAYWRIGHT_WSS) {
      const { html: h, title: t } = await brightdataWss(url)
      html = h
      title = t
    }

    if (!html && process.env.BRIGHTDATA_API_KEY) {
      html = await brightdataHosted(url)
      title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    }

    const markdown = await markdownify(url, html)

    const [htmlBlob, markdownBlob] = await Promise.all([
      put(`brightdata/${normalized}.html`, html, {
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
    return null
  }
}
