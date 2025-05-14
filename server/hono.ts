import { auth } from '@everynews/auth'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { openAPISpecs } from 'hono-openapi'
import { newsHono } from './news'

const app = new Hono<WithAuth>()
  .basePath('/api')
  .use('*', authMiddleware)
  .on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))
  .route('/news', newsHono)

app.get(
  '/',
  Scalar({
    sources: [
      {
        content: openAPISpecs(app, {
          documentation: {
            info: {
              description: 'API for greeting users',
              title: 'Everynews API',
              version: '0.1.0',
            },
          },
        }),
        title: 'Everynews',
      },
      {
        content: await auth.api.generateOpenAPISchema(),
        title: 'Everynews Auth',
      },
    ],
    theme: 'saturn',
  }),
)

export type AppType = typeof app

export { app }
