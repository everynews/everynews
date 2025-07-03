'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import type { Channel } from '@everynews/schema/channel'
import {
  DiscordChannelConfigSchema,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import type { Subscription } from '@everynews/schema/subscription'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

interface SendTestAlertButtonProps {
  alert: Alert
  subscription: Subscription
  channel?: Channel
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export const SendTestAlertButton = ({
  alert,
  subscription,
  channel,
  variant = 'ghost',
  size = 'sm',
  className,
}: SendTestAlertButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleSendTest = async () => {
    setIsLoading(true)
    try {
      const res = await api.alerts.test.$post({
        json: {
          alertId: alert.id,
          channelId: subscription.channelId,
        },
      })

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string }
        const errorMessage = errorData?.error || 'Failed to send test alert'
        toast.error(errorMessage)
        return
      }

      const channelName = channel
        ? channel.type === 'slack'
          ? (() => {
              const parsed = SlackChannelConfigSchema.safeParse(channel.config)
              if (parsed.success) {
                return `#${parsed.data.channel?.name || 'your Slack channel'}`
              }
              return 'your Slack channel'
            })()
          : channel.type === 'discord'
            ? (() => {
                const parsed = DiscordChannelConfigSchema.safeParse(
                  channel.config,
                )
                if (parsed.success) {
                  return `#${parsed.data.channel?.name || 'your Discord channel'}`
                }
                return 'your Discord channel'
              })()
            : (() => {
                const parsed = z
                  .object({ destination: z.string() })
                  .safeParse(channel.config)
                if (parsed.success) {
                  return parsed.data.destination
                }
                return 'your channel'
              })()
        : 'your email'

      toast.success('Test alert sent!', {
        description: `Check ${channelName} for the test alert.`,
      })
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSendTest}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
      title='Send test alert'
    >
      {isLoading ? 'Sending...' : 'Test'}
    </Button>
  )
}
