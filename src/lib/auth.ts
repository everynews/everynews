import { database } from '~/database'
import { sendMagicLink } from '~/email'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
  admin,
  apiKey,
  magicLink,
  openAPI,
  organization,
} from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins/passkey'
import { env } from '~/lib/env'

export const auth = betterAuth({
  appName: '@everynews/api/auth',
  basePath: '/auth',
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(database, {
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
    openAPI(),
  ],
})
