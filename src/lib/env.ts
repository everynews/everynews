import { z } from 'zod'

const envSchema = z.object({
  EVERYNEWS_AUTH_SECRET: z.string().min(1),
  EVERYNEWS_AUTH_URL: z.string().min(1),
  EVERYNEWS_DB_DATABASE_URL: z.string().min(1),
})

export const env = envSchema.parse({
  ...process.env,
  EVERYNEWS_AUTH_URL: process.env.EVERYNEWS_AUTH_URL ?? process.env.VERCEL_URL,
})
