import { ChannelDtoSchema, ChannelSchema } from '@everynews/schema/channel'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'
import { createChannel } from './handlers/create'
import { deleteChannel } from './handlers/delete'
import { listChannels } from './handlers/list'
import { getSubscriptionCount } from './handlers/subscription-count'
import { updateChannel } from './handlers/update'
import { checkVerification, sendVerification } from './handlers/verification'

export const ChannelRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/',
    describeRoute({
      description: 'Get All Channels',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema.array()),
            },
          },
          description: 'Get All Channels',
        },
      },
    }),
    listChannels,
  )
  .post(
    '/',
    describeRoute({
      description: 'Create Channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Create Channel',
        },
      },
    }),
    zValidator('json', ChannelDtoSchema),
    createChannel,
  )
  .put(
    '/:id',
    describeRoute({
      description: 'Update Channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(ChannelSchema),
            },
          },
          description: 'Update Channel',
        },
      },
    }),
    zValidator('json', ChannelDtoSchema),
    updateChannel,
  )
  .delete(
    '/:id',
    describeRoute({
      description: 'Delete Channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
          description: 'Delete Channel',
        },
      },
    }),
    deleteChannel,
  )
  .get(
    '/:id/subscription-count',
    describeRoute({
      description: 'Get subscription count for a channel',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ count: z.number() })),
            },
          },
          description: 'Subscription count',
        },
      },
    }),
    getSubscriptionCount,
  )
  .post(
    '/:id/send-verification',
    describeRoute({
      description: 'Send verification code',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
          description: 'Verification code sent',
        },
      },
    }),
    sendVerification,
  )
  .post(
    '/:id/check-verification',
    describeRoute({
      description: 'Check verification code',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
          description: 'Verification successful',
        },
      },
    }),
    zValidator('json', z.object({ code: z.string() })),
    checkVerification,
  )
