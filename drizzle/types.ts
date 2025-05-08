import * as schema from '@everynews/drizzle/schema'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const searchQuerySchema = z.object({
  filters: z.record(z.any()).optional(),
  provider: z.string(),
  query: z.string(),
})

export const relevanceSettingsSchema = z.object({
  filters: z
    .object({
      domains: z.array(z.string()).optional(),
      excludeDomains: z.array(z.string()).optional(),
      excludeKeywords: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  minScore: z.number().min(0).max(1),
  weights: z.object({
    content: z.number().optional(),
    title: z.number().optional(),
    url: z.number().optional(),
  }),
})

export const waitSettingsSchema = z
  .object({
    countSettings: z
      .object({
        threshold: z.number().int().positive(),
      })
      .optional(),
    timeSettings: z
      .object({
        sendAt: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
        timezone: z.string(),
      })
      .optional(),
    type: z.enum(['time', 'count', 'both']),
  })
  .refine(
    (data) => {
      if (data.type === 'time' && !data.timeSettings) return false
      if (data.type === 'count' && !data.countSettings) return false
      if (data.type === 'both' && (!data.timeSettings || !data.countSettings))
        return false
      return true
    },
    {
      message: 'Settings must match the specified type',
    },
  )

export const channelConfigSchema = z
  .object({
    discord: z
      .object({
        template: z.string().optional(),
        webhook: z.string().url(),
      })
      .optional(),
    email: z
      .object({
        recipients: z.array(z.string().email()),
        template: z.string().optional(),
      })
      .optional(),
    slack: z
      .object({
        channel: z.string().optional(),
        template: z.string().optional(),
        webhook: z.string().url(),
      })
      .optional(),
    text: z
      .object({
        // TODO: replace to z.e164() when Zod 4 releases
        recipients: z.array(z.string().regex(/^\+?[1-9]\d{1,14}$/)),
        template: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one channel configuration must be provided',
  })

export const newsSchema = createSelectSchema(schema.news, {
  relevanceSettings: relevanceSettingsSchema,
  searchQuery: searchQuerySchema,
  waitSettings: waitSettingsSchema,
})

export const newsArraySchema = z.array(newsSchema)

export const channelsSchema = createSelectSchema(schema.channels, {
  config: channelConfigSchema,
})

export const storiesSchema = createSelectSchema(schema.stories)

export const schedulesSchema = createSelectSchema(schema.schedules)

export const usersSchema = createSelectSchema(schema.users)

export type SearchQuery = z.infer<typeof searchQuerySchema>

export type RelevanceSettings = z.infer<typeof relevanceSettingsSchema>

export type WaitSettings = z.infer<typeof waitSettingsSchema>

export type ChannelConfig = z.infer<typeof channelConfigSchema>

export type News = z.infer<typeof newsSchema>

export type NewsArray = z.infer<typeof newsArraySchema>

export type Channel = z.infer<typeof channelsSchema>

export type Story = z.infer<typeof storiesSchema>

export type Schedule = z.infer<typeof schedulesSchema>

export type User = z.infer<typeof usersSchema>
