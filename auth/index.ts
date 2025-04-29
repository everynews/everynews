import { db } from '@everynews/db'
import { sendMagicLink } from '@everynews/email'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import {
  admin,
  apiKey,
  magicLink,
  openAPI,
  organization,
} from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins/passkey'

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not defined')
}

export const auth = betterAuth({
  appName: '@everynews/api/auth',
  basePath: '/api/auth',
  secret: process.env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  plugins: [
    apiKey(),
    admin(),
    organization(),
    passkey(),
    magicLink({
      sendMagicLink,
    }),
    nextCookies(),
    openAPI(),
  ],
})
