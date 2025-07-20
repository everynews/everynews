import type { EmailProviderResponse } from '@everynews/schema'

export type SendSignInEmailParams = {
  to: string
}

export type SendTemplateEmailParams = {
  to: string
  subject: string
  template: React.ReactElement
}

export type EmailProvider = {
  signIn: (params: SendSignInEmailParams) => Promise<EmailProviderResponse>
  template: (params: SendTemplateEmailParams) => Promise<EmailProviderResponse>
}
