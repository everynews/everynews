import { auth } from '@everynews/auth'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { newsHono } from '@everynews/server/routes/news'
import { Hono } from 'hono'

const server = new Hono<WithAuth>()
  .basePath('/api')
  .use('*', authMiddleware)
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/news', newsHono)

export { server }
export type AppType = typeof server
