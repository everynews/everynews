import { db } from '@everynews/drizzle'
import { NewsSchema, news } from '@everynews/schema'
import { and, eq, lt } from 'drizzle-orm'
import { curator } from './subroutines/curator'
import { reaper } from './subroutines/reaper'

const found = await NewsSchema.array().parse(
  await db.query.news.findMany({
    where: and(eq(news.active, true), lt(news.nextRun, new Date())),
  }),
)
for (const newsItem of found) {
  if (newsItem.strategy.provider !== 'exa') continue
  const urls = await curator(newsItem)
  const content = await reaper(urls)
  console.log({ content, urls })
}
console.log({ ok: true })
