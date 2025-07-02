import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { invitations } from '@everynews/schema'
import { InvitationSchema } from '@everynews/schema/invitation'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'

export const InvitationRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .get(
    '/:token',
    describeRoute({
      description: 'Get invitation details by token',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(InvitationSchema),
            },
          },
          description: 'Invitation details',
        },
        404: {
          description: 'Invitation not found or expired',
        },
      },
    }),
    async (c) => {
      const { token } = c.req.param()

      const invitation = await db.query.invitations.findFirst({
        where: and(
          eq(invitations.token, token),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      })

      if (!invitation) {
        return c.json({ error: 'Invitation not found or expired' }, 404)
      }

      return c.json(invitation)
    },
  )
  .post(
    '/:token/accept',
    describeRoute({
      description: 'Mark invitation as accepted',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
          description: 'Invitation accepted',
        },
        404: {
          description: 'Invitation not found or expired',
        },
      },
    }),
    async (c) => {
      const { token } = c.req.param()
      const user = c.get('user')

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Update invitation
      const result = await db
        .update(invitations)
        .set({ acceptedAt: new Date() })
        .where(
          and(
            eq(invitations.token, token),
            isNull(invitations.acceptedAt),
            gt(invitations.expiresAt, new Date()),
          ),
        )
        .returning()

      if (result.length === 0) {
        return c.json({ error: 'Invitation not found or expired' }, 404)
      }

      const invitation = result[0]

      await track({
        channel: 'invitations',
        description: `Invitation accepted for alert ${invitation.alertId}`,
        event: 'Invitation Accepted',
        icon: '✅',
        tags: {
          alert_id: invitation.alertId,
          inviter_id: invitation.inviterId,
          type: 'info',
        },
        user_id: user.id,
      })

      return c.json({ success: true })
    },
  )
