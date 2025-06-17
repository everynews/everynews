import { sendEmailWithTemplate } from '../emails'
import { ChannelVerificationEmail } from '../emails/channel-verification'
import { MagicLinkEmail } from '../emails/magic-link'

export const sendMagicLink = async ({
  email,
  url,
}: {
  email: string
  url: string
}): Promise<void> => {
  await sendEmailWithTemplate(
    email,
    'Sign in to Everynews',
    MagicLinkEmail({ signinLink: url }),
  )
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
  await sendEmailWithTemplate(
    email,
    `Verify your notification channel "${channelName}"`,
    ChannelVerificationEmail({ channelName, verificationLink }),
  )
}
