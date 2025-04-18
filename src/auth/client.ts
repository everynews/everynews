'use client'

import { createAuthClient } from 'better-auth/react'
import { magicLinkClient, passkeyClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
