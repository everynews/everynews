import { db } from '@everynews/drizzle'
import type { getAll } from '@everynews/server/news/routes'
import type { AppRouteHandler } from '@everynews/server/type'

export const getAllHandler: AppRouteHandler<typeof getAll> = async (c) => {
  const res = await db.query.news.findMany()
  return c.json(res, 200)
}
