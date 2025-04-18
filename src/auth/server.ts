import { createAuthClient } from 'better-auth/react'
import { magicLinkClient, passkeyClient } from 'better-auth/client/plugins'

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error('NEXT_PUBLIC_SITE_URL is not defined')
}

export const authServer = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [magicLinkClient(), passkeyClient()],
})

export const { signIn, signOut, signUp, getSession } = authServer
