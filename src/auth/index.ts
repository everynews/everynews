'use client'

import { magicLinkClient, passkeyClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const auth = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
})

