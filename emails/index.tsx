import { plunkProvider } from './providers/plunk'
import { resendProvider } from './providers/resend'
import type { SendSignInEmailParams, SendTemplateEmailParams } from './types'

const emailProvider =
  process.env.EMAIL_PROVIDER === 'plunk' ? plunkProvider : resendProvider

export const sendSignInEmail = async (params: SendSignInEmailParams) =>
  emailProvider.signIn(params)

export const sendTemplateEmail = async (params: SendTemplateEmailParams) =>
  emailProvider.template(params)
