import * as schema from '@everynews/drizzle/schema'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

export const db = drizzle(neon(process.env.DATABASE_URL), {
  schema,
})
