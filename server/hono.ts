import { auth } from '@everynews/auth'
import { url } from '@everynews/lib/url'
import { AlertRouter } from '@everynews/server/alerts'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { ChannelRouter } from '@everynews/server/channels'
import { DrillRouter } from '@everynews/server/drill'
import { InvitationRouter } from '@everynews/server/invitations'
import { PromptRouter } from '@everynews/server/prompts'
import { SessionRouter } from '@everynews/server/sessions'
import { SlackRouter } from '@everynews/server/slack'
import { SubscriptionRouter } from '@everynews/server/subscriptions'
import { UserRouter } from '@everynews/server/users'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { generateSpecs } from 'hono-openapi'

const app = new Hono<WithAuth>()
  .basePath('/api')
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
  .route('/alerts', AlertRouter)
  .route('/channels', ChannelRouter)
  .route('/drill', DrillRouter)
  .route('/invitations', InvitationRouter)
  .route('/prompts', PromptRouter)
  .route('/sessions', SessionRouter)
  .route('/slack', SlackRouter)
  .route('/subscriptions', SubscriptionRouter)
  .route('/users', UserRouter)

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
