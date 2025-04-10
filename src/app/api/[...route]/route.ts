import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { auth } from '~/lib/auth'
export const dynamic = 'force-dynamic'
const app = new Hono().basePath('/api')
app.get('/hello', c =>
  c.json({
    message: 'Hello from Hono on Vercel!',
  }),
)
app.on(['POST', 'GET'], '/auth/**', c => auth.handler(c.req.raw))
export const GET = handle(app)
export const POST = handle(app)
