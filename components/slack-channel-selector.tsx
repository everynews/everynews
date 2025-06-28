'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@everynews/components/ui/select'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SlackChannelSelectorProps {
  channelId: string
}

export const SlackChannelSelector = ({
  channelId,
}: SlackChannelSelectorProps) => {
  const router = useRouter()
  const [channels, setChannels] = useState<
    Array<{ id: string; name: string; is_private: boolean }>
  >([])
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      const response = await api.slack.channels.$post({
        json: { channelId },
      })

      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels)
      } else {
        toast.error('Failed to load Slack channels')
      }
    } catch (error) {
      toast.error('Error loading Slack channels')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedChannel) {
      toast.error('Please select a channel')
      return
    }

    setSaving(true)
    try {
      const channel = channels.find((c) => c.id === selectedChannel)
      if (!channel) return

      const response = await api.channels[':id'].$put({
        json: {
          config: {
            channel: {
              id: channel.id,
              name: channel.name,
            },
            destination: `#${channel.name}`,
          },
          name: `Slack - ${channel.name}`,
          type: 'slack',
        },
        param: { id: channelId },
      })

      if (response.ok) {
        toast.success('Slack channel connected successfully!')
        router.push('/channels')
        router.refresh()
      } else {
        toast.error('Failed to update channel')
      }
    } catch (error) {
      toast.error('Error saving channel')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading Slack channels...</div>
  }

  return (
    <div className='space-y-4'>
      <div>
        <label className='text-sm font-medium'>Select Slack Channel</label>
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger>
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

      <Button onClick={handleSave} disabled={!selectedChannel || saving}>
        {saving ? 'Saving...' : 'Save Channel'}
      </Button>
    </div>
  )
}
