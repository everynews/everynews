type LogEventOptions = {
  channel: string
  event: string
  description?: string
  icon?: string
  user_id?: string
  tags?: Record<string, string | number | boolean>
  notify?: boolean
}

export const track = async (options: LogEventOptions) => {
  try {
    const isDev = process.env.NODE_ENV === 'development'
    const isCI =
      process.env.CI === 'true' ||
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.ACTIONS === 'true'

    // Do not emit any logs in CI (e.g., GitHub Actions) to avoid leakage
    if (isCI) return

    const channel = isDev ? `dev-${options.channel}` : `prod-${options.channel}`

    const payload = {
      channel,
      description: options.description,
      event: options.event,
      icon: options.icon,
      notify: options.notify,
      tags: options.tags,
      timestamp: new Date().toISOString(),
      user_id: options.user_id,
    }

    const severity =
      typeof options.tags?.type === 'string'
        ? String(options.tags.type).toLowerCase()
        : 'info'

    if (severity === 'error') {
      console.error('LogEvent:', payload)
    } else if (severity === 'warn' || severity === 'warning') {
      console.warn('LogEvent:', payload)
    } else {
      console.log('LogEvent:', payload)
    }
  } catch (error) {
    const isCI =
      process.env.CI === 'true' ||
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.ACTIONS === 'true'
    if (!isCI) {
      console.error('Failed to log event:', error)
    }
  }
}
