import { track } from '@everynews/logs'
import { omit } from 'es-toolkit'
import { plunkProvider } from './providers/plunk'
import { resendProvider } from './providers/resend'
import type { SendTemplateEmailParams } from './types'

export const sendTemplateEmail = async (params: SendTemplateEmailParams) => {
  try {
    const result = await plunkProvider.template(params)
    await track({
      channel: 'worker',
      description: 'Email sent with Plunk',
      event: 'Email Delivery Success',
      icon: '✅',
      tags: {
        type: 'info',
        ...omit(params, ['template']),
        result: JSON.stringify(result),
      },
    })
  } catch (error) {
    await track({
      channel: 'worker',
      description: 'Failed to send email with Plunk',
      event: 'Email Delivery Skipped',
      icon: '⏭️',
      tags: {
        type: 'error',
        ...omit(params, ['template']),
        error: JSON.stringify(error),
      },
    })
    const result = await resendProvider.template(params)
    await track({
      channel: 'worker',
      description: 'Email sent with Resend',
      event: 'Email Delivery Success',
      icon: '✅',
      tags: {
        type: 'info',
        ...omit(params, ['template']),
        result: JSON.stringify(result),
      },
    })
  }
}
