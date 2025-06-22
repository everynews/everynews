import { render } from '@react-email/components'
import { plunkProvider } from './providers/plunk'
import { resendProvider } from './providers/resend'
import type { SendEmailParams } from './types'

// Default to Resend provider
const emailProvider =
  process.env.EMAIL_PROVIDER === 'plunk' ? plunkProvider : resendProvider

export const sendEmail = async (params: SendEmailParams) => {
  return emailProvider.sendEmail(params)
}

export const sendEmailWithTemplate = async (
  to: string,
  subject: string,
  template: React.ReactElement,
) => {
  const html = await render(template)
  return sendEmail({ html, subject, to })
}
