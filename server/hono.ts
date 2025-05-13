import { type AuthType, auth } from '@everynews/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { newsHono } from '@everynews/server/routes/news'
import { Hono } from 'hono'

const server = new Hono<{ Bindings: AuthType }>()
  .basePath('/api')
  .get('/hello', (c) =>
    c.json({
      message: 'Hello from Hono on Vercel!',
    }),
  )
  .use(authMiddleware)
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/news', newsHono)

export { server }
export type AppType = typeof server
