import { auth } from '@everynews/auth'
import { url } from '@everynews/lib/url'
import { AlertRouter } from '@everynews/server/alerts'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { ChannelRouter } from '@everynews/server/channels'
import { DrillRouter } from '@everynews/server/drill'
import { PromptsRouter } from '@everynews/server/prompts'
import { SubscriptionRouter } from '@everynews/server/subscriptions'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { generateSpecs } from 'hono-openapi'

const app = new Hono<WithAuth>()
  .basePath('/api')
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/alerts', AlertRouter)
  .route('/channels', ChannelRouter)
  .route('/drill', DrillRouter)
  .route('/prompts', PromptsRouter)
  .route('/subscriptions', SubscriptionRouter)

app.get(
  '/',
  Scalar({
    sources: [
      {
        content: await generateSpecs(app, {
          documentation: {
            info: {
              description: 'API for Everynews',
              title: 'Everynews API',
              version: '0.1.0',
            },
            servers: [
              {
                url,
              },
            ],
          },
        }),
        title: 'Everynews',
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
        title: 'Everynews Auth',
      },
    ],
  }),
)

export type AppType = typeof app

export { app }
