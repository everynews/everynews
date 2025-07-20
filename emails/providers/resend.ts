import { url } from '@everynews/lib/url'
import { ResendResponseSchema } from '@everynews/schema'
import { Resend } from 'resend'
import MagicLinkEmail from '../magic-link'
import type {
  EmailProvider,
  SendSignInEmailParams,
  SendTemplateEmailParams,
} from '../types'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}
if (!process.env.RESEND_FROM_EMAIL) {
  throw new Error('RESEND_FROM_EMAIL is not set')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export const resendProvider: EmailProvider = {
  signIn: async ({ to }: SendSignInEmailParams) => {
    const signinLink = `${url}/api/auth/verify-email`
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@every.news',
      react: MagicLinkEmail({ signinLink }),
      subject: 'Sign in to Everynews',
      to,
    })
    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }
    return ResendResponseSchema.parse(result.data || {})
  },
  template: async ({ to, subject, template }: SendTemplateEmailParams) => {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@every.news',
      react: template,
      subject,
      to,
    })

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }

    return ResendResponseSchema.parse(result.data || {})
  },
}
