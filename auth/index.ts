import { db } from '@everynews/database'
import { sendMagicLink } from '@everynews/messengers'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin, magicLink, oneTap, openAPI } from 'better-auth/plugins'

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not defined')
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID is not defined')
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET is not defined')
}

export const auth = betterAuth({
  appName: '@everynews/api/auth',
  basePath: '/api/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink,
    }),
    nextCookies(),
    openAPI({
      disableDefaultReference: true,
    }),
    admin(),
    oneTap(),
  ],
  secret: process.env.AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      enabled: true,
    },
  },
})

export type AuthType = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}
