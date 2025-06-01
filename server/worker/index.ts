import { db } from '@everynews/drizzle'
import { NewsSchema, news } from '@everynews/schema'
import { WorkerStatusSchema } from '@everynews/schema/worker-status'
import { and, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver, validator } from 'hono-openapi/zod'
import { z } from 'zod'
import type { WithAuth } from '../bindings/auth'
import { CuratorService } from '../services/curator.service'

export const WorkerRouter = new Hono<WithAuth>()
  .post(
    '/',
    describeRoute({
      description: 'Run Worker',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(WorkerStatusSchema),
            },
          },
          description: 'Run Worker',
        },
      },
    }),
    async (c) => {
      const found = await NewsSchema.array().parse(
        await db.query.news.findMany({
          where: and(eq(news.active, true), lt(news.nextRun, new Date())),
        }),
      )
      for (const newsItem of found) {
        await CuratorService.get().enqueue(newsItem)
      }
      return c.json({ ok: true })
    },
  )
  .post(
    '/scrape',
    describeRoute({
      description: 'Scrape URL',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(
                z.object({
                  content: z.any(),
                }),
              ),
            },
          },
          description: 'Scraped content',
        },
      },
    }),
    validator('json', z.object({ url: z.string().url() })),
    async (c) => {
      const { url } = await c.req.json()

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        body: JSON.stringify({
          formats: ['markdown'],
          scrapeOptions: {
            onlyMainContent: true,
          },
          url,
        }),
        headers: {
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(
          `Firecrawl API error: ${response.status} ${response.statusText}`,
        )
      }

      const scrapeResult = await response.json()
      return c.json({ content: scrapeResult })
    },
  )
