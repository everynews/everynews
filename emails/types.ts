export type SendEmailParams = {
  to: string
  subject: string
  body?: string
  html?: string
}

export type EmailResponse = {
  id?: string
  [key: string]: unknown
}

export type EmailProvider = {
  sendEmail: (params: SendEmailParams) => Promise<EmailResponse>
}
