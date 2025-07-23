import {
  adminClient,
  magicLinkClient,
  oneTapClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

if (!process.env.GOOGLE_ONE_TAP_CLIENT_ID) {
  throw new Error('GOOGLE_ONE_TAP_CLIENT_ID is not defined')
}

export const auth = createAuthClient({
  plugins: [
    magicLinkClient(),
    adminClient(),
    oneTapClient({
      autoSelect: false,
      cancelOnTapOutside: true,
      clientId: process.env.GOOGLE_ONE_TAP_CLIENT_ID,
      context: 'signin',
      promptOptions: {
        baseDelay: 1000,
        maxAttempts: 5,
      },
    }),
  ],
})

// await authClient.oneTap();

// const signIn = async () => {
//   const data = await authClient.signIn.social({
//     provider: "google"
//   })
// }
