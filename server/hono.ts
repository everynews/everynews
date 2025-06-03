import { auth } from '@everynews/auth'
import { url } from '@everynews/lib/url'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { generateSpecs } from 'hono-openapi'
import { ChannelRouter } from './channels'
import { NewsRouter } from './news'
import { SubscriptionRouter } from './subscriptions'
import { WorkerRouter } from './worker'

const app = new Hono<WithAuth>()
  .basePath('/api')
  .use('*', authMiddleware)
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/news', NewsRouter)
  .route('/channels', ChannelRouter)
  .route('/subscriptions', SubscriptionRouter)
  .route('/worker', WorkerRouter)

app.get(
  '/',
  Scalar({
    sources: [
      {
        content: await generateSpecs(app, {
          documentation: {
            info: {
              description: 'API for every.news',
              title: 'every.news API',
              version: '0.1.0',
            },
            servers: [
              {
                url,
              },
            ],
          },
        }),
        title: 'every.news',
      },
      {
        content: {
          ...(await auth.api.generateOpenAPISchema()),
          servers: [
            {
              url: `${url}/api/auth`,
            },
          ],
        },
        title: 'every.news Auth',
      },
    ],
  }),
)

export type AppType = typeof app

export { app }
