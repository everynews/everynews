import { headers } from 'next/headers'
import { auth } from './index'

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
