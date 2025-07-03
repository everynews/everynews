import {
  type Channel,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import { AlertCircle, CheckCircle, Circle } from 'lucide-react'

interface ChannelStatusBadgeProps {
  channel: Channel
}

export const ChannelStatusBadge = ({ channel }: ChannelStatusBadgeProps) => {
  // Slack channels have different status logic
  if (channel.type === 'slack') {
    const config = SlackChannelConfigSchema.safeParse(channel.config)
    if (!config.success) {
      return (
        <span className='flex items-center gap-1 text-destructive'>
          <AlertCircle className='size-3' />
          Invalid Config
        </span>
      )
    }

    const hasChannel = config.data.channel?.id
    const hasAccessToken = config.data.accessToken

    if (!hasAccessToken) {
      return (
        <span className='flex items-center gap-1 text-destructive'>
          <AlertCircle className='size-3' />
          Disconnected
        </span>
      )
    }

    if (!hasChannel) {
      return (
        <span className='flex items-center gap-1 text-muted-foreground'>
          <Circle className='size-3' />
          Setup Required
        </span>
      )
    }

    return (
      <span className='flex items-center gap-1'>
        <CheckCircle className='size-3' />
        Connected
      </span>
    )
  }

  // Discord channels have different status logic
  if (channel.type === 'discord') {
    const hasChannel = channel.config.channel?.id
    const hasBotToken = channel.config.botToken

    if (!hasBotToken) {
      return (
        <span className='flex items-center gap-1 text-destructive'>
          <AlertCircle className='size-3' />
          Disconnected
        </span>
      )
    }

    if (!hasChannel) {
      return (
        <span className='flex items-center gap-1 text-muted-foreground'>
          <Circle className='size-3' />
          Setup Required
        </span>
      )
    }

    return (
      <span className='flex items-center gap-1'>
        <CheckCircle className='size-3' />
        Connected
      </span>
    )
  }

  // Regular channels use verification status
  if (channel.verified) {
    return (
      <span className='flex items-center gap-1'>
        <CheckCircle className='size-3' />
        Verified
      </span>
    )
  }

  return (
    <span className='flex items-center gap-1 text-muted-foreground'>
      <Circle className='size-3' />
      Pending
    </span>
  )
}
