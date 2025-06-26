import { track } from '@everynews/logs'
import type { Story, Strategy, WaitSchema } from '@everynews/schema'
import type { z } from 'zod'

type Wait = z.infer<typeof WaitSchema>

const SURGE_API_KEY = process.env.SURGE_API_KEY
const SURGE_API_BASE = 'https://api.surge.app'

export const sendSurgeVerification = async ({
  phoneNumber,
}: {
  phoneNumber: string
}): Promise<string> => {
  if (!SURGE_API_KEY) {
    throw new Error('SURGE_API_KEY not configured')
  }

  try {
    const response = await fetch(`${SURGE_API_BASE}/verifications`, {
      body: JSON.stringify({
        phone_number: phoneNumber,
      }),
      headers: {
        Authorization: `Bearer ${SURGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Surge API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    await track({
      channel: 'surge',
      description: `Sent verification code to ${phoneNumber}`,
      event: 'Phone Verification Sent',
      icon: '📱',
      tags: {
        phone_number: phoneNumber,
        type: 'info',
        verification_id: data.id,
      },
    })

    return data.id
  } catch (error) {
    await track({
      channel: 'surge',
      description: `Failed to send verification to ${phoneNumber}`,
      event: 'Phone Verification Failed',
      icon: '❌',
      tags: {
        error: String(error),
        phone_number: phoneNumber,
        type: 'error',
      },
    })
    throw error
  }
}

export const checkSurgeVerification = async ({
  verificationId,
  code,
}: {
  verificationId: string
  code: string
}): Promise<boolean> => {
  if (!SURGE_API_KEY) {
    throw new Error('SURGE_API_KEY not configured')
  }

  try {
    const response = await fetch(
      `${SURGE_API_BASE}/verifications/${verificationId}/checks`,
      {
        body: JSON.stringify({ code }),
        headers: {
          Authorization: `Bearer ${SURGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    const data = await response.json()

    if (response.ok && data.result === 'ok') {
      await track({
        channel: 'surge',
        description: 'Phone verification successful',
        event: 'Phone Verification Completed',
        icon: '✅',
        tags: {
          type: 'info',
          verification_id: verificationId,
        },
      })
      return true
    }

    await track({
      channel: 'surge',
      description: `Phone verification failed: ${data.result}`,
      event: 'Phone Verification Check Failed',
      icon: '❌',
      tags: {
        result: data.result,
        type: 'warning',
        verification_id: verificationId,
      },
    })
    return false
  } catch (error) {
    await track({
      channel: 'surge',
      description: 'Error checking phone verification',
      event: 'Phone Verification Error',
      icon: '💥',
      tags: {
        error: String(error),
        type: 'error',
        verification_id: verificationId,
      },
    })
    throw error
  }
}

export const sendSurgeAlert = async ({
  phoneNumber,
  alertName,
  stories,
  strategy,
  wait,
}: {
  phoneNumber: string
  alertName: string
  stories: Story[]
  strategy: Strategy
  wait: Wait
}): Promise<void> => {
  if (!SURGE_API_KEY) {
    throw new Error('SURGE_API_KEY not configured')
  }

  try {
    // Format the alert message
    const messageBody = formatAlertMessage({
      alertName,
      stories,
      strategy,
      wait,
    })

    // Get the Surge account ID from environment
    const accountId = process.env.SURGE_ACCOUNT_ID
    if (!accountId) {
      throw new Error('SURGE_ACCOUNT_ID not configured')
    }

    const response = await fetch(
      `${SURGE_API_BASE}/accounts/${accountId}/messages`,
      {
        body: JSON.stringify({
          body: messageBody,
          conversation: {
            contact: {
              phone_number: phoneNumber,
            },
          },
        }),
        headers: {
          Authorization: `Bearer ${SURGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Surge API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    await track({
      channel: 'surge',
      description: `Sent SMS alert to ${phoneNumber}`,
      event: 'SMS Alert Sent',
      icon: '📱',
      tags: {
        alert_name: alertName,
        destination: phoneNumber,
        message_id: data.id,
        stories_count: stories.length,
        type: 'info',
      },
    })
  } catch (error) {
    await track({
      channel: 'surge',
      description: `Failed to send SMS to ${phoneNumber}`,
      event: 'SMS Alert Failed',
      icon: '❌',
      tags: {
        alert_name: alertName,
        destination: phoneNumber,
        error: String(error),
        type: 'error',
      },
    })
    throw error
  }
}

function formatAlertMessage({
  alertName,
  stories,
}: {
  alertName: string
  stories: Story[]
  strategy: Strategy
  wait: Wait
}): string {
  // For single story, provide more detail
  if (stories.length === 1) {
    const story = stories[0]
    return `${alertName}: ${story.title}\n\nRead more: ${story.url}`
  }

  // For multiple stories
  const storyList = stories
    .slice(0, 3) // Limit to 3 stories for SMS
    .map((story, index) => `${index + 1}. ${story.title}`)
    .join('\n')

  const totalCount =
    stories.length > 3 ? `\n\n+${stories.length - 3} more stories` : ''

  return `${alertName} (${stories.length} stories):\n\n${storyList}${totalCount}\n\nView all: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://every.news'}`
}
