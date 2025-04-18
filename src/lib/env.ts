import { z } from 'zod'

const envSchema = z.object({
  VERCEL_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
})

console.log({
  VERCEL_URL: process.env.VERCEL_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
})

export const env = envSchema.parse(
  {
    VERCEL_URL: process.env.VERCEL_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  }
)
