'use client'

import { updateDiscordChannel } from '@everynews/app/actions/discord-channel'
import { Button } from '@everynews/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@everynews/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface DiscordChannelSelectorClientProps {
  channelId: string
  channels: Array<{ id: string; name: string; type: number }>
}

const DiscordSelectChannelSchema = z.object({
  channel: z.string().min(1, 'Please select a channel'),
})

type DiscordSelectChannelForm = z.infer<typeof DiscordSelectChannelSchema>

export const DiscordChannelSelectorClient = ({
  channelId,
  channels,
}: DiscordChannelSelectorClientProps) => {
  const form = useForm<DiscordSelectChannelForm>({
    defaultValues: { channel: '' },
    resolver: zodResolver(DiscordSelectChannelSchema),
  })

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

    await updateDiscordChannel(channelId, channel.id, channel.name)
  }

  // Check if no channels are available
  if (channels.length === 0) {
    return (
      <div className='space-y-3 sm:space-y-4'>
        <div>
          <label
            htmlFor='discord-channel'
            className='text-xs sm:text-sm font-medium'
          >
            Select Discord Channel
          </label>
          <Select disabled>
            <SelectTrigger id='discord-channel' disabled>
              <SelectValue placeholder='No channels available' />
            </SelectTrigger>
          </Select>
          <p className='mt-2 text-xs sm:text-sm text-muted-foreground'>
            No text channels found in your Discord server. Please create a text
            channel first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className='space-y-3 sm:space-y-4'>
      <div>
        <Select
          name='channel'
          value={form.watch('channel')}
          onValueChange={(value) => form.setValue('channel', value)}
        >
          <SelectTrigger id='discord-channel'>
            <SelectValue placeholder='Choose a channel' />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                #{channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type='submit'
        disabled={!form.formState.isValid || !form.watch('channel')}
        className='w-full sm:w-auto'
      >
        Save Channel
      </Button>
    </form>
  )
}
