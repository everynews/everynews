import { auth } from '@everynews/auth'
import { headers } from 'next/headers'

export const whoami = async () =>
  await auth.api
    .getSession({
      headers: await headers(),
    })
    .then((s) => s?.user)
