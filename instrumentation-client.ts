import posthog from 'posthog-js'

if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  throw new Error('NEXT_PUBLIC_POSTHOG_KEY is not set')
}

if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) {
  throw new Error('NEXT_PUBLIC_POSTHOG_HOST is not set')
}

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageview: 'history_change',
})
