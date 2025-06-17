import { render } from '@react-email/components'

interface SendEmailParams {
  to: string
  subject: string
  body?: string
  html?: string
}

export async function sendEmail({ to, subject, body, html }: SendEmailParams) {
  const response = await fetch('https://api.useplunk.com/v1/send', {
    method: 'POST',
    body: JSON.stringify({
      to,
      subject,
      body: body || html || '',
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  return response.json()
}

export async function sendEmailWithTemplate(
  to: string,
  subject: string,
  template: React.ReactElement
) {
  const html = await render(template)
  return sendEmail({ to, subject, html })
}