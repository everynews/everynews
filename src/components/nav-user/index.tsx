import { NavUserNotSignedIn } from './not-signed-in'
import { NavUserSignedIn } from './signed-in'
import { Suspense } from 'react'
import { NavUserLoading } from './loading'
import { getUser } from '~/auth/server'

export const NavUser = async () => {
  const user = await getUser()

  return (
    <Suspense fallback={<NavUserLoading />}>
      {user ? <NavUserSignedIn {...user} /> : <NavUserNotSignedIn />}
    </Suspense>
  )
}
