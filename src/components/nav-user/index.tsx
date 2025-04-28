import { getUser } from '@everynews/auth/server'
import { Suspense } from 'react'
import { NavUserLoading } from './loading'
import { NavUserNotSignedIn } from './not-signed-in'
import { NavUserSignedIn } from './signed-in'

export const NavUser = async () => {
  const user = await getUser()

  return (
    <Suspense fallback={<NavUserLoading />}>
      {user ? <NavUserSignedIn {...user} /> : <NavUserNotSignedIn />}
    </Suspense>
  )
}
