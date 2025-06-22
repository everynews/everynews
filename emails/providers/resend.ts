import { Resend } from 'resend'
import type { EmailProvider, SendEmailParams } from '../types'

const resend = new Resend(process.env.RESEND_API_KEY)

export const resendProvider: EmailProvider = {
  sendEmail: async ({ to, subject, body, html }: SendEmailParams) => {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@every.news',
      html,
      subject,
      text: body,
      to,
    })

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`)
    }

    return result.data
  },
}
