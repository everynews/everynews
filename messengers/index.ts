import { sendTemplateEmail } from '@everynews/emails'
import ChannelVerificationEmail from '@everynews/emails/channel-verification'
import MagicLinkEmail from '@everynews/emails/magic-link'
import PasswordResetEmail from '@everynews/emails/password-reset'
import SubscriptionConfirmationEmail from '@everynews/emails/subscription-confirmation'
import VerifyEmail from '@everynews/emails/verify-email'

export { sendDiscordAlert, sendDiscordVerification } from './discord'
export { sendSlackAlert, sendSlackVerification } from './slack'
export {
  checkPhoneVerification,
  sendPhoneVerification,
  sendSmsAlert,
} from './surge'

export const sendMagicLink = async (
  {
    email,
    url,
  }: {
    email: string
    url: string
  },
  request?: Request,
): Promise<void> => {
  // Check if this is a subscription flow
  const isSubscriptionFlow =
    request?.headers.get('x-subscription-flow') === 'true'
  const encodedAlertName = request?.headers.get('x-alert-name')
  const alertName = encodedAlertName
    ? decodeURIComponent(encodedAlertName)
    : null

  if (isSubscriptionFlow && alertName) {
    // Send subscription confirmation email
    const template = SubscriptionConfirmationEmail({ alertName, url })

    await sendTemplateEmail({
      subject: `Confirm your subscription to ${alertName}`,
      template,
      to: email,
    })
  } else {
    // Send regular magic link email
    const template = MagicLinkEmail({ signinLink: url })

    await sendTemplateEmail({
      subject: 'Sign in to Everynews',
      template,
      to: email,
    })
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
  const template = ChannelVerificationEmail({ channelName, verificationLink })

  await sendTemplateEmail({
    subject: `Verify your notification channel "${channelName}"`,
    template,
    to: email,
  })
}

export const sendResetPassword = async (
  {
    user,
    url,
  }: {
    user: { email: string }
    url: string
    token: string
  },
  _request?: Request,
): Promise<void> => {
  const template = PasswordResetEmail({ resetLink: url })

  await sendTemplateEmail({
    subject: 'Reset your password for Everynews',
    template,
    to: user.email,
  })
}

export const sendVerificationEmail = async (
  {
    user,
    url,
  }: {
    user: { email: string }
    url: string
    token: string
  },
  _request?: Request,
): Promise<void> => {
  const template = VerifyEmail({ verificationLink: url })

  await sendTemplateEmail({
    subject: 'Verify your email address for Everynews',
    template,
    to: user.email,
  })
}
