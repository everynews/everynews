import { redirect } from 'next/navigation'

export const redirectToSignIn = (callbackPath?: string) => {
  const signInUrl = callbackPath
    ? `/sign-in?callback=${encodeURIComponent(callbackPath)}`
    : '/sign-in'

  redirect(signInUrl)
}
