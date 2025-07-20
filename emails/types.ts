import type { EmailResponse } from '@everynews/schema'

export type SendSignInEmailParams = {
  to: string
}

export type SendTemplateEmailParams = {
  to: string
  subject: string
  template: React.ReactElement
}

export type EmailProvider = {
  signIn: (params: SendSignInEmailParams) => Promise<EmailResponse>
  template: (params: SendTemplateEmailParams) => Promise<EmailResponse>
}
