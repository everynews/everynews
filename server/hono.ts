import { auth } from '@everynews/auth'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { newsRouter } from '@everynews/server/news'
import { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'

const app = new OpenAPIHono<WithAuth>()

app.basePath('/api')

app.use('*', authMiddleware)

app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

app.route('/api/news', newsRouter)

app.doc31('/api/doc', {
  info: {
    title: 'Everynews API',
    version: '0.1.0',
  },
  openapi: '3.1.1',
})

app.get('/api/auth/doc', async (c) => {
  return c.json(await auth.api.generateOpenAPISchema())
})

app.get(
  '/api',
  Scalar({
    sources: [
      { title: 'Everynews', url: '/api/doc' },
      { title: 'Everynews Auth', url: '/api/auth/doc' },
    ],
    theme: 'default',
  }),
)

export { app }
export type AppType = typeof app
