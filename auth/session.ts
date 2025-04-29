import { auth } from '@everynews/auth'
import { headers } from 'next/headers'

export const session = async () =>
  auth.api.getSession({
    headers: await headers(),
  })
