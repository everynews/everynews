import { magicLinkClient, passkeyClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authServer = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
})

export const { signIn, signOut, signUp, getSession } = authServer
