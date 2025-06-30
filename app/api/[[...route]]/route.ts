import { app } from '@everynews/server/hono'
import { handle } from 'hono/vercel'

export const dynamic = 'force-dynamic'

export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
