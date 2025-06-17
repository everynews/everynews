import { render } from '@react-email/components'

type SendEmailParams = {
  to: string
  subject: string
  body?: string
  html?: string
}

export const sendEmail = async ({
  to,
  subject,
  body,
  html,
}: SendEmailParams) => {
  const response = await fetch('https://api.useplunk.com/v1/send', {
    body: JSON.stringify({
      body: body || html || '',
      subject,
      to,
    }),
    headers: {
      Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  return response.json()
}

export const sendEmailWithTemplate = async (
  to: string,
  subject: string,
  template: React.ReactElement,
) => {
  const html = await render(template)
  return sendEmail({ html, subject, to })
}
