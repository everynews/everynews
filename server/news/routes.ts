import { newsSchema } from '@everynews/schema/news'
import { createRoute } from '@hono/zod-openapi'

export const getAll = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: newsSchema.array(),
        },
      },
      description: 'The list of news',
    },
  },
})
