import * as schema from '@everynews/drizzle/schema'
import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

if (process.env.NODE_ENV !== 'production') {
  neonConfig.wsProxy = (host) => `${host}:5433/v1`
  neonConfig.useSecureWebSocket = false
  neonConfig.pipelineTLS = false
  neonConfig.pipelineConnect = false
}

export const db = drizzle(neon(process.env.DATABASE_URL), {
  schema,
})
