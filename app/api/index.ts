import { AppType } from '@everynews/server/hono'
import { hc } from 'hono/client'

const { api } = hc<AppType>(
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://every.news',
)

export { api }
