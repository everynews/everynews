import { sendTemplateEmail } from '@everynews/emails'
import ChannelVerificationEmail from '@everynews/emails/channel-verification'
import MagicLinkEmail from '@everynews/emails/magic-link'
import SubscriptionConfirmationEmail from '@everynews/emails/subscription-confirmation'

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
