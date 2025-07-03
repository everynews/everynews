'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { toastNetworkError } from '@everynews/lib/error'
import type { Channel } from '@everynews/schema/channel'
import { DiscordChannelConfigSchema } from '@everynews/schema/channel'
import { useState } from 'react'
import { toast } from 'sonner'

interface DiscordTestButtonProps {
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

export const DiscordTestButton = ({
  channel,
  variant = 'outline',
  size = 'default',
  className,
}: DiscordTestButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleTest = async () => {
    if (!channel || channel?.type !== 'discord') return

    setIsLoading(true)
    try {
      const res = await api.discord.test.$post({
        json: { channelId: channel.id },
      })

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string }
        const errorMessage = errorData?.error || 'Failed to send test message'
        toast.error(errorMessage)
        return
      }

      const config = DiscordChannelConfigSchema.parse(channel.config)
      toast.success('Test message sent!', {
        description: `Check ${config.channel?.name ? `#${config.channel.name}` : 'your Discord channel'} for the test message.`,
      })
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  if (channel?.type !== 'discord') return null

  const config = DiscordChannelConfigSchema.safeParse(channel.config)
  const hasChannel = config.success && config.data.channel?.id

  return (
    <Button
      onClick={handleTest}
      disabled={isLoading || !hasChannel}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? 'Sending...' : 'Send Test Message'}
    </Button>
  )
}
