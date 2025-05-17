import { url } from '@everynews/lib/url'
import type { AppType } from '@everynews/server/hono'
import { hc } from 'hono/client'

const { api } = hc<AppType>(url, {
  init: {
    credentials: 'include',
  },
})

export { api }
