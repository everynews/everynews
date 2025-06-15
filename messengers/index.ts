import { Resend } from 'resend'
import { ChannelVerificationEmail } from '../emails/channel-verification'
import { MagicLinkEmail } from '../emails/magic-link'

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
    from: 'Everynews <no-reply@app.every.news>',
    react: MagicLinkEmail({ signinLink: url }),
    subject: 'Sign in to Everynews',
    to: [email],
  })

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`)
  }
}

export const sendChannelVerification = async ({
  channelName,
  email,
  verificationLink,
}: {
  channelName: string
  email: string
  verificationLink: string
}): Promise<void> => {
  const { error } = await resend.emails.send({
    from: 'Everynews <no-reply@app.every.news>',
    react: ChannelVerificationEmail({ channelName, verificationLink }),
    subject: `Verify your notification channel "${channelName}"`,
    to: [email],
  })

  if (error) {
    throw new Error(`Failed to send channel verification: ${error.message}`)
  }
}
