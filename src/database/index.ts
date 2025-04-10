import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '~/lib/env'
const client = neon(env.EVERYNEWS_DB_DATABASE_URL)
export const database = drizzle(client)
