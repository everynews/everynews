import { Resend } from 'resend'
import { MagicLinkEmail } from '../magic-link'
import type {
  EmailProvider,
  SendAlertEmailParams,
  SendSignInEmailParams,
} from '../types'

const resend = new Resend(process.env.RESEND_API_KEY)

export const resendProvider: EmailProvider = {
  alert: async ({ to, subject, template }: SendAlertEmailParams) => {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@every.news',
      react: template,
      subject,
      to,
    })

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }

    return result.data || {}
  },
  signIn: async ({ to }: SendSignInEmailParams) => {
    const signinLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://every.news'}/api/auth/verify-email`
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@every.news',
      react: MagicLinkEmail({ signinLink }),
      subject: 'Sign in to Everynews',
      to,
    })
    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }
    return result.data || {}
  },
}
