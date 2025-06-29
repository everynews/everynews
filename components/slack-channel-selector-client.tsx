'use client'

import { updateSlackChannel } from '@everynews/app/actions/slack-channel'
import { Button } from '@everynews/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@everynews/components/ui/select'
import { useState } from 'react'
import { toast } from 'sonner'

interface SlackChannelSelectorClientProps {
  channelId: string
  channels: Array<{ id: string; name: string; is_private: boolean }>
}

export const SlackChannelSelectorClient = ({
  channelId,
  channels,
}: SlackChannelSelectorClientProps) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('')

  const handleSubmit = async (formData: FormData) => {
    const channelValue = formData.get('channel') as string
    if (!channelValue) {
      toast.error('Please select a channel')
      return
    }

    const channel = channels.find((c) => c.id === channelValue)
    if (!channel) {
      toast.error('Invalid channel selected')
      return
    }

    try {
      await updateSlackChannel(channelId, channel.id, channel.name)
      toast.success('Slack channel connected successfully!')
    } catch (error) {
      console.error('Failed to update Slack channel:', error)
      toast.error('Failed to update channel. Please try again.')
    }
  }

  return (
    <form action={handleSubmit} className='space-y-4'>
      <div>
        <label htmlFor='slack-channel' className='text-sm font-medium'>
          Select Slack Channel
        </label>
        <Select
          name='channel'
          value={selectedChannel}
          onValueChange={setSelectedChannel}
        >
          <SelectTrigger id='slack-channel'>
            <SelectValue placeholder='Choose a channel' />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                #{channel.name} {channel.is_private && '🔒'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type='submit' disabled={!selectedChannel}>
        Save Channel
      </Button>
    </form>
  )
}
