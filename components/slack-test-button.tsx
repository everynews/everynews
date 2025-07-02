'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { toastNetworkError } from '@everynews/lib/error'
import type { Channel } from '@everynews/schema/channel'
import { SlackChannelConfigSchema } from '@everynews/schema/channel'
import { useState } from 'react'
import { toast } from 'sonner'

interface SlackTestButtonProps {
  channel: Channel
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

export const SlackTestButton = ({
  channel,
  variant = 'outline',
  size = 'default',
  className,
}: SlackTestButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = async () => {
    if (channel.type !== 'slack') return

    setIsLoading(true)
    try {
      const res = await api.slack.test.$post({
        json: { channelId: channel.id },
      })

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string }
        const errorMessage = errorData?.error || 'Failed to send test message'
        toast.error(errorMessage)
        return
      }

      const parsed = SlackChannelConfigSchema.safeParse(channel.config)
      const channelName =
        parsed.success && parsed.data.channel?.name
          ? `#${parsed.data.channel.name}`
          : 'your Slack channel'

      toast.success('Test message sent!', {
        description: `Check ${channelName} for the test message.`,
      })
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  if (channel.type !== 'slack') return null

  const parsed = SlackChannelConfigSchema.safeParse(channel.config)
  const hasChannelId = parsed.success && !!parsed.data.channel?.id

  return (
    <Button
      onClick={handleTest}
      disabled={isLoading || !hasChannelId}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? 'Sending...' : 'Send Test Message'}
    </Button>
  )
}
