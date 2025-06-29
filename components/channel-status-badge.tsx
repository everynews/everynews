import { Badge } from '@everynews/components/ui/badge'
import type { Channel } from '@everynews/schema/channel'
import { AlertCircle, CheckCircle, Circle } from 'lucide-react'

interface ChannelStatusBadgeProps {
  channel: Channel
}

export const ChannelStatusBadge = ({ channel }: ChannelStatusBadgeProps) => {
  // Slack channels have different status logic
  if (channel.type === 'slack') {
    const hasChannel = channel.config.channel?.id
    const hasAccessToken = channel.config.accessToken

    if (!hasAccessToken) {
      return (
        <Badge variant='destructive' className='gap-1'>
          <AlertCircle className='size-3' />
          Disconnected
        </Badge>
      )
    }

    if (!hasChannel) {
      return (
        <Badge variant='secondary' className='gap-1'>
          <Circle className='size-3' />
          Setup Required
        </Badge>
      )
    }

    return (
      <Badge variant='default' className='gap-1'>
        <CheckCircle className='size-3' />
        Connected
      </Badge>
    )
  }

  // Regular channels use verification status
  if (channel.verified) {
    return (
      <Badge variant='default' className='gap-1'>
        <CheckCircle className='size-3' />
        Verified
      </Badge>
    )
  }

  return (
    <Badge variant='secondary' className='gap-1'>
      <Circle className='size-3' />
      Pending
    </Badge>
  )
}
