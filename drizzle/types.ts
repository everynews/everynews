import * as schema from '@everynews/drizzle/schema'
import { createSchemaFactory } from 'drizzle-zod'
import { z } from 'zod'

export const strategySchema = z.object({
  provider: z.string(),
  query: z.string().optional(),
})

const { createSelectSchema, createInsertSchema, createUpdateSchema } =
  createSchemaFactory({
    coerce: {
      date: true,
    },
  })

export const waitSettingsSchema = z
  .object({
    count: z.number().nullable(),
    cron: z.string().nullable(),
  })
  .refine((data) => data.count !== null || data.cron !== null, {
    message: 'At least one wait setting must be provided',
  })

export const channelConfigSchema = z
  .object({
    email: z
      .object({
        recipients: z.array(z.string().email()),
        template: z.string().optional(),
      })
      .nullable(),
    slack: z
      .object({
        channel: z.string().optional(),
        template: z.string().optional(),
        webhook: z.string().url(),
      })
      .nullable(),
    text: z
      .object({
        recipients: z.array(z.string().regex(/^\+?[1-9]\d{1,14}$/)),
        template: z.string().optional(),
      })
      .nullable(),
  })
  .refine(
    (data) => data.email !== null || data.slack !== null || data.text !== null,
    {
      message: 'At least one channel configuration must be provided',
    },
  )

export const newsReadSchema = createSelectSchema(schema.news, {
  strategy: strategySchema,
  wait: waitSettingsSchema,
})

export const newsArraySchema = z.array(newsReadSchema)

export const newsCreateSchema = createInsertSchema(schema.news, {
  strategy: strategySchema,
  wait: waitSettingsSchema,
})

export const newsUpdateSchema = createUpdateSchema(schema.news, {
  strategy: strategySchema,
  wait: waitSettingsSchema,
})

export const channelsReadSchema = createSelectSchema(schema.channels, {
  config: channelConfigSchema,
})

export const channelsCreateSchema = createInsertSchema(schema.channels, {
  config: channelConfigSchema,
})

export const channelsUpdateSchema = createUpdateSchema(schema.channels, {
  config: channelConfigSchema,
})

export const storiesReadSchema = createSelectSchema(schema.stories)

export const storiesCreateSchema = createInsertSchema(schema.stories)

export const storiesUpdateSchema = createUpdateSchema(schema.stories)

export type strategy = z.infer<typeof strategySchema>

export type WaitSettings = z.infer<typeof waitSettingsSchema>

export type ChannelConfig = z.infer<typeof channelConfigSchema>

export type News = z.infer<typeof newsReadSchema>

export type NewsArray = z.infer<typeof newsArraySchema>

export type Channel = z.infer<typeof channelsReadSchema>

export type Story = z.infer<typeof storiesReadSchema>
