import { auth } from '@everynews/auth'
import { redirectToSignIn } from '@everynews/lib/auth-redirect'
import { headers } from 'next/headers'
import { redirect, unauthorized } from 'next/navigation'

export const getUser = async () =>
  await auth.api
    .getSession({
      headers: await headers(),
    })
    .then((s) => s?.user)

export const guardUser = async () => {
  const user = await getUser()

  if (!user) {
    redirectToSignIn()
    return unauthorized()
  }

  if (!user.emailVerified) {
    redirect('/email-verification-required')
  }

  return user
}
