import { server } from '@everynews/server/hono'
import { handle } from 'hono/vercel'

export const dynamic = 'force-dynamic'

export const GET = handle(server)
export const POST = handle(server)
export const DELETE = handle(server)
export const PUT = handle(server)
