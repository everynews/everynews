import { url } from '@everynews/lib/url'
import { render } from '@react-email/components'
import MagicLinkEmail from '../magic-link'
import type {
  EmailProvider,
  SendSignInEmailParams,
  SendTemplateEmailParams,
} from '../types'

if (!process.env.PLUNK_API_KEY) {
  throw new Error('PLUNK_API_KEY is not set')
}

if (!process.env.PLUNK_FROM_EMAIL) {
  throw new Error('PLUNK_FROM_EMAIL is not set')
}

const sendPlunkEmail = async (
  to: string,
  subject: string,
  body: string,
  html?: string,
) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000) // 20 second timeout

  try {
    const response = await fetch('https://api.useplunk.com/v1/send', {
      body: JSON.stringify({
        body: body || html || '',
        subject,
        to,
      }),
      headers: {
        Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

export const plunkProvider: EmailProvider = {
  signIn: async ({ to }: SendSignInEmailParams) => {
    const signinLink = `${url}/api/auth/verify-email`
    const html = await render(MagicLinkEmail({ signinLink }))
    return sendPlunkEmail(to, 'Sign in to Everynews', '', html)
  },
  template: async ({ to, subject, template }: SendTemplateEmailParams) => {
    const html = await render(template)
    return sendPlunkEmail(to, subject, '', html)
  },
}
