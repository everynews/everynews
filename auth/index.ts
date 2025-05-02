import { sendMagicLink, sendOTP } from '@everynews/comms'
import { db } from '@everynews/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink, phoneNumber } from 'better-auth/plugins'

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
    phoneNumber({
      sendOTP,
    }),
    nextCookies(),
  ],
  secret: process.env.AUTH_SECRET,
})
