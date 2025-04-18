import { createAuthClient } from 'better-auth/react'
import { magicLinkClient, passkeyClient } from 'better-auth/client/plugins'
import { env } from '~/lib/env'

export const authClient = createAuthClient({
  baseURL: env.VERCEL_URL,
  plugins: [magicLinkClient(), passkeyClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
