import { auth } from '@everynews/auth'
import { newsHono } from '@everynews/server/routes/news'
import { Hono } from 'hono'

const server = new Hono()
  .basePath('/api')
  .get('/hello', (c) =>
    c.json({
      message: 'Hello from Hono on Vercel!',
    }),
  )
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/news', newsHono)

export { server }
export type AppType = typeof server
