import { z } from 'zod'
import 'zod-openapi/extend'

// Strategy is a JSON field in the news table, so there is no pgTable definition
export const strategySchema = z
  .discriminatedUnion('provider', [
    z.object({
      provider: z.literal('hnbest').openapi({ example: 'hnbest' }),
      query: z.string().optional().openapi({ example: 'News' }),
    }),
    z.object({
      provider: z.literal('google').openapi({ example: 'google' }),
      query: z.string().optional().openapi({ example: 'News' }),
    }),
    z.object({
      provider: z.literal('github').openapi({ example: 'github' }),
      token: z.string().optional().openapi({ example: 'ghp_xxxxxxxxxxxxx' }),
    }),
    z.object({
      domain: z.string().openapi({ example: 'example.com' }),
      provider: z.literal('whois').openapi({ example: 'whois' }),
    }),
    z.object({
      limit: z.number().min(1).max(50).openapi({ example: 10 }),
      provider: z.literal('producthunt').openapi({ example: 'producthunt' }),
      token: z.string().openapi({ example: 'Bearer YOUR_DEVELOPER_TOKEN' }),
    }),
  ])
  .openapi({ ref: 'StrategySchema' })

export type Strategy = z.infer<typeof strategySchema>
