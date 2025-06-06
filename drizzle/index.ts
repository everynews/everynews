import * as schema from '@everynews/schema'
import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { drizzle as neonDrizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { Pool } from 'pg'
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

const dev = process.env.NODE_ENV === 'development'

let db: NeonHttpDatabase<Record<string, unknown>> & {
    $client: NeonQueryFunction<any, any>;
} | ReturnType<typeof pgDrizzle>

if (dev) {
  db = pgDrizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
} else {
  db = neonDrizzle(neon(process.env.DATABASE_URL), { schema })
}

export { db }
