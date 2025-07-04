import { auth } from '@everynews/auth'
import { track } from '@everynews/logs'
import type { Context } from 'hono'

export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      await track({
        channel: 'auth',
        description: `${c.req.method} ${c.req.path}`,
        event: 'Unauthenticated Request',
        icon: '🔒',
        tags: {
          method: c.req.method,
          path: c.req.path,
          type: 'error',
          user_agent: c.req.header('user-agent') || 'unknown',
        },
      })
      c.set('user', null)
      c.set('session', null)
      return next()
    }
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
