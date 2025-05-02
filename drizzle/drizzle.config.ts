import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './db/schema.ts',
})
