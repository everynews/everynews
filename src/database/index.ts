import { Client } from '@planetscale/database'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { env } from '~/lib/env'

const client = new Client({
  host: env.DATABASE_HOST,
  username: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD
})

export const database = drizzle(client)
