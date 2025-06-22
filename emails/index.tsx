import { plunkProvider } from './providers/plunk'
import { resendProvider } from './providers/resend'
import type { SendSignInEmailParams, SendTemplateEmailParams } from './types'

export const sendSignInEmail = async (params: SendSignInEmailParams) => {
  try {
    plunkProvider.signIn(params)
  } catch (error) {
    resendProvider.signIn(params)
  }
}

export const sendTemplateEmail = async (params: SendTemplateEmailParams) => {
  try {
    plunkProvider.template(params)
  } catch (error) {
    resendProvider.template(params)
  }
}
