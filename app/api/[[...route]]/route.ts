import { server } from '@everynews/server/hono'
import { handle } from 'hono/vercel'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export const GET = handle(server)
export const POST = handle(server)
