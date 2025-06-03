import { auth } from '@everynews/auth'
import { track } from '@everynews/logs'
import type { Context } from 'hono'

export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      await track({
        channel: 'auth',
        description: `Unauthenticated request to ${c.req.method} ${c.req.path}`,
        event: 'Unauthenticated Request',
        icon: '🔒',
        tags: {
          method: c.req.method,
          path: c.req.path,
          user_agent: c.req.header('user-agent') || 'unknown',
          type: 'error',
        },
      })
      c.set('user', null)
      c.set('session', null)
      return next()
    }

    await track({
      channel: 'auth',
      description: `Authenticated request to ${c.req.method} ${c.req.path}`,
      event: 'Authenticated Request',
      icon: '✅',
      tags: {
        method: c.req.method,
        path: c.req.path,
        user_email: session.user.email,
        type: 'info',
      },
      user_id: session.user.id,
    })

    c.set('user', session.user)
    c.set('session', session.session)
    return next()
  } catch (error) {
    await track({
      channel: 'auth',
      description: `Auth middleware failed: ${String(error)}`,
      event: 'Auth Middleware Error',
      icon: '❌',
      tags: {
        error: String(error),
        method: c.req.method,
        path: c.req.path,
        type: 'error',
      },
    })
    throw error
  }
}
