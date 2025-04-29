
import { auth } from '@everynews/auth'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

export const dynamic = 'force-dynamic'

// Hono App
const app = new Hono().basePath('/api')

// Health Check
app.get('/hello', c =>
  c.json({
    message: 'Hello from Hono on Vercel!',
  }),
)

// Auth
app.on('*', '/auth/**', c => auth.handler(c.req.raw))

// Export handlers
export const GET = handle(app)
export const POST = handle(app)
