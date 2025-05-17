import { url } from '@everynews/lib/url'
import type { AppType } from '@everynews/server/hono'
import { hc } from 'hono/client'
import { cookies } from 'next/headers'

export const serverApi = async () => {
  const cookieHeader = (await cookies()).toString()
  return hc<AppType>(url, { init: { headers: { cookie: cookieHeader } } }).api
}
