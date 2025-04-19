import { auth } from './index'
import { headers } from 'next/headers'

export const getUser = async () =>
  await auth.api
    .getSession({
      headers: await headers(),
    })
    .then(s => s?.user)

export const signOut = async () =>
  await auth.api.signOut({
    headers: await headers(),
  })
