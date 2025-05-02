import { auth } from '@everynews/auth'
import { Hono } from 'hono'

export const server = new Hono()
  .basePath('/api')
  .get('/hello', (c) =>
    c.json({
      message: 'Hello from Hono on Vercel!',
    }),
  )
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
