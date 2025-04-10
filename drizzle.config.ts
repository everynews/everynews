import { defineConfig } from 'drizzle-kit'
import { env } from '~/lib/env'
export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.EVERYNEWS_DB_DATABASE_URL,
  },
})
