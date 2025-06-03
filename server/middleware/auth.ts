import { auth } from '@everynews/auth'
import { trackEvent } from '@everynews/server/lib/logsnag'
import type { Context } from 'hono'

export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      await trackEvent({
        channel: 'auth',
        event: 'Unauthenticated Request',
        description: `Unauthenticated request to ${c.req.method} ${c.req.path}`,
        icon: '🔒',
        tags: {
          method: c.req.method,
          path: c.req.path,
          user_agent: c.req.header('user-agent') || 'unknown',
        },
      })
      c.set('user', null)
      c.set('session', null)
      return next()
    }

    await trackEvent({
      channel: 'auth',
      event: 'Authenticated Request',
      description: `Authenticated request to ${c.req.method} ${c.req.path}`,
      icon: '✅',
      user_id: session.user.id,
      tags: {
        method: c.req.method,
        path: c.req.path,
        user_email: session.user.email,
      },
    })

    c.set('user', session.user)
    c.set('session', session.session)
    return next()
  } catch (error) {
    await trackEvent({
      channel: 'auth',
      event: 'Auth Middleware Error',
      description: `Auth middleware failed: ${String(error)}`,
      icon: '❌',
      tags: {
        method: c.req.method,
        path: c.req.path,
        error: String(error),
      },
    })
    throw error
  }
}
