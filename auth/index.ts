import { db } from '@everynews/drizzle'
import { sendMagicLink } from '@everynews/messages'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink, openAPI } from 'better-auth/plugins'

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not defined')
}

export const auth = betterAuth({
  appName: '@everynews/api/auth',
  basePath: '/api/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  plugins: [
    magicLink({
      sendMagicLink,
    }),
    nextCookies(),
    openAPI({ disableDefaultReference: true }),
  ],
  secret: process.env.AUTH_SECRET,
})

export type AuthType = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}
