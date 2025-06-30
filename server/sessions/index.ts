import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { sessions } from '@everynews/schema'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { z } from 'zod'

export const SessionRouter = new Hono<WithAuth>().use(authMiddleware).delete(
  '/:id',
  describeRoute({
    description: 'Revoke a user session',
    responses: {
      200: {
        description: 'Session revoked successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      403: {
        description: 'Forbidden - cannot revoke other users sessions',
      },
      404: {
        description: 'Session not found',
      },
    },
  }),
  zValidator('param', z.object({ id: z.string() })),
  async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')

    if (!user) {
      await track({
        channel: 'sessions',
        description: 'User tried to revoke session without authentication',
        event: 'Unauthorized Access',
        icon: '🚫',
        tags: {
          type: 'error',
        },
      })
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const [targetSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))

    if (!targetSession) {
      return c.json({ error: 'Session not found' }, 404)
    }

    if (targetSession.userId !== user.id) {
      await track({
        channel: 'sessions',
        description: `User ${user.id} tried to revoke session of user ${targetSession.userId}`,
        event: 'Forbidden Access',
        icon: '🚫',
        tags: {
          targetUserId: targetSession.userId,
          type: 'error',
          userId: user.id,
        },
      })
      return c.json({ error: 'Forbidden' }, 403)
    }

    await db
      .delete(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, user.id)))

    await track({
      channel: 'sessions',
      description: `User ${user.id} revoked session ${id}`,
      event: 'Session Revoked',
      icon: '🔐',
      tags: {
        sessionId: id,
        type: 'info',
        userId: user.id,
      },
    })

    return c.json({ message: 'Session revoked successfully' })
  },
)
