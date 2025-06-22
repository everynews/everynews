import { sendTemplateEmail } from '@everynews/emails'

export const sendMagicLink = async ({
  email,
  url,
}: {
  email: string
  url: string
}): Promise<void> => {
  const { MagicLinkEmail } = await import('@everynews/emails/magic-link')

  const template = MagicLinkEmail({ signinLink: url })

  await sendTemplateEmail({
    subject: 'Sign in to Everynews',
    template,
    to: email,
  })
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
  const { ChannelVerificationEmail } = await import(
    '@everynews/emails/channel-verification'
  )

  const template = ChannelVerificationEmail({ channelName, verificationLink })

  await sendTemplateEmail({
    subject: `Verify your notification channel "${channelName}"`,
    template,
    to: email,
  })
}
