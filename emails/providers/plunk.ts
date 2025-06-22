import type { EmailProvider, SendEmailParams } from '../types'

export const plunkProvider: EmailProvider = {
  sendEmail: async ({ to, subject, body, html }: SendEmailParams) => {
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
  },
}
