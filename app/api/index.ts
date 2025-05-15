import { url } from '@everynews/config/url'
import type { AppType } from '@everynews/server/hono'
import { hc } from 'hono/client'

const { api } = hc<AppType>(url)

export { api }
