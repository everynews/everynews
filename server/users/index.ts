import { auth } from '@everynews/auth/client'
import { db } from '@everynews/database'
import { track } from '@everynews/logs'
import { users } from '@everynews/schema'
import { UserSchema } from '@everynews/schema/user'
import type { WithAuth } from '@everynews/server/bindings/auth'
import { authMiddleware } from '@everynews/server/middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'

const UpdateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

export const UserRouter = new Hono<WithAuth>()
  .use(authMiddleware)
  .patch(
    '/:id',
    describeRoute({
      description: 'Update user profile',
      responses: {
        200: {
          content: {
            'application/json': {
              schema: resolver(UserSchema),
            },
          },
          description: 'User updated successfully',
        },
        401: {
          description: 'Unauthorized',
        },
        403: {
          description: 'Forbidden - cannot update other users',
        },
      },
    }),
    zValidator('param', z.object({ id: z.string() })),
    zValidator('json', UpdateUserSchema),
    async (c) => {
      const user = c.get('user')
      const { id } = c.req.valid('param')
      const data = c.req.valid('json')

      if (!user) {
        await track({
          channel: 'users',
          description: 'User tried to update profile without authentication',
          event: 'Unauthorized Access',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      if (user.id !== id) {
        await track({
          channel: 'users',
          description: `User ${user.id} tried to update profile of user ${id}`,
          event: 'Forbidden Access',
          icon: '🚫',
          tags: {
            targetUserId: id,
            type: 'error',
            userId: user.id,
          },
        })
        return c.json({ error: 'Forbidden' }, 403)
      }

      // Check if email is being changed
      const [currentUser] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, id))

      const emailChanged = currentUser.email !== data.email

      const [updatedUser] = await db
        .update(users)
        .set({
          email: data.email,
          name: data.name,
          // Set emailVerified to false if email is changing
          ...(emailChanged && { emailVerified: false }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning()

      if (emailChanged) {
        await auth.sendVerificationEmail({ email: updatedUser.email })
      }

      await track({
        channel: 'users',
        description: `User ${user.id} updated their profile${emailChanged ? ' (email changed)' : ''}`,
        event: 'Profile Updated',
        icon: '✏️',
        tags: {
          type: 'info',
          userId: user.id,
          ...(emailChanged && { emailChanged: true }),
        },
      })

      return c.json(UserSchema.parse(updatedUser))
    },
  )
  .delete(
    '/me',
    describeRoute({
      description: 'Delete current user account',
      responses: {
        200: {
          description: 'Account deleted successfully',
        },
        401: {
          description: 'Unauthorized',
        },
      },
    }),
    async (c) => {
      const user = c.get('user')

      if (!user) {
        await track({
          channel: 'users',
          description: 'User tried to delete account without authentication',
          event: 'Unauthorized Access',
          icon: '🚫',
          tags: {
            type: 'error',
          },
        })
        return c.json({ error: 'Unauthorized' }, 401)
      }

      // Delete user and all related data (cascading deletes should handle relations)
      await db.delete(users).where(eq(users.id, user.id))

      await track({
        channel: 'users',
        description: `User ${user.id} deleted their account`,
        event: 'Account Deleted',
        icon: '🗑️',
        tags: {
          type: 'info',
          userEmail: user.email,
          userId: user.id,
        },
      })

      return c.json({ message: 'Account deleted successfully' })
    },
  )
