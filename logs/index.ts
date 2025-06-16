import { LogSnag } from '@logsnag/node'

if (!process.env.LOGSNAG_PROJECT_TOKEN) {
  throw new Error('LOGSNAG_PROJECT_TOKEN is not set')
}

if (!process.env.LOGSNAG_PROJECT_ID) {
  throw new Error('LOGSNAG_PROJECT_ID is not set')
}

export const logsnag = new LogSnag({
  project: process.env.LOGSNAG_PROJECT_ID,
  token: process.env.LOGSNAG_PROJECT_TOKEN,
})

type LogEventOptions = {
  channel: string
  event: string
  description?: string
  icon?: string
  user_id?: string
  tags?: Record<string, string | number>
  notify?: boolean
}

export const track = async (options: LogEventOptions) => {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    const channel = isDev ? `dev-${options.channel}` : `prod-${options.channel}`
    await logsnag.track({
      ...options,
      channel,
      tags: options.tags
        ? Object.fromEntries(
            Object.entries(options.tags).map(([key, value]) => [
              // LogSnag has a limit of 160 characters for tags, we truncate to 150
              key.slice(0, 150),
              String(value).slice(0, 150),
            ]),
          )
        : undefined,
    })
  } catch (error) {
    console.error('Failed to track event to LogSnag:', error)
  }
}
