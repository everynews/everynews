import { guardUser } from '@everynews/auth/session'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

interface RequireVerifiedEmailProps {
  children: ReactNode
  redirectTo?: string
}

export const RequireVerifiedEmail = async ({
  children,
  redirectTo = '/email-verification-required',
}: RequireVerifiedEmailProps) => {
  const user = await guardUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (!user.emailVerified) {
    redirect(redirectTo)
  }

  return <>{children}</>
}
