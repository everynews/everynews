import { Resend } from 'resend'
import MagicLinkEmail from '../emails/magic-link'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendMagicLink = async ({
  email,
  url,
}: {
  email: string
  url: string
}): Promise<void> => {
  const { error } = await resend.emails.send({
    from: 'every.news <no-reply@app.every.news>',
    react: MagicLinkEmail({ loginLink: url }),
    subject: 'Sign in to every.news',
    to: [email],
  })

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`)
  }
}
