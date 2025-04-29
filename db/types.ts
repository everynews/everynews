import {
  apikeys,
  channels,
  members,
  news,
  organizations,
  schedules,
  stories,
  users,
} from '@everynews/db/schema'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const searchQuerySchema = z.object({
  provider: z.string(),
  query: z.string(),
  filters: z.record(z.any()).optional(),
  apiKey: z.string().optional(),
})

export const relevanceSettingsSchema = z.object({
  minScore: z.number().min(0).max(1),
  weights: z.object({
    title: z.number().optional(),
    content: z.number().optional(),
    url: z.number().optional(),
  }),
  filters: z
    .object({
      domains: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      excludeDomains: z.array(z.string()).optional(),
      excludeKeywords: z.array(z.string()).optional(),
    })
    .optional(),
})

export const waitSettingsSchema = z
  .object({
    type: z.enum(['time', 'count', 'both']),
    timeSettings: z
      .object({
        sendAt: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
        timezone: z.string(),
      })
      .optional(),
    countSettings: z
      .object({
        threshold: z.number().int().positive(),
      })
      .optional(),
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
    text: z
      .object({
        // TODO: replace to z.e164() when Zod 4 releases
        recipients: z.array(z.string().regex(/^\+?[1-9]\d{1,14}$/)),
        template: z.string().optional(),
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
        webhook: z.string().url(),
        channel: z.string().optional(),
        template: z.string().optional(),
      })
      .optional(),
    discord: z
      .object({
        webhook: z.string().url(),
        template: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one channel configuration must be provided',
  })

export const newsSchema = createSelectSchema(news, {
  searchQuery: searchQuerySchema,
  relevanceSettings: relevanceSettingsSchema,
  waitSettings: waitSettingsSchema,
})

export const channelsSchema = createSelectSchema(channels, {
  config: channelConfigSchema,
})

export const storiesSchema = createSelectSchema(stories)

export const schedulesSchema = createSelectSchema(schedules)

export const usersSchema = createSelectSchema(users)

export const organizationsSchema = createSelectSchema(organizations)

export const membersSchema = createSelectSchema(members)

export const apikeysSchema = createSelectSchema(apikeys)

export type SearchQuery = z.infer<typeof searchQuerySchema>

export type RelevanceSettings = z.infer<typeof relevanceSettingsSchema>

export type WaitSettings = z.infer<typeof waitSettingsSchema>

export type ChannelConfig = z.infer<typeof channelConfigSchema>

export type News = z.infer<typeof newsSchema>

export type Channel = z.infer<typeof channelsSchema>

export type Story = z.infer<typeof storiesSchema>

export type Schedule = z.infer<typeof schedulesSchema>

export type ApiKey = z.infer<typeof apikeysSchema>

export type Organization = z.infer<typeof organizationsSchema>

export type Member = z.infer<typeof membersSchema>

export type User = z.infer<typeof usersSchema>
