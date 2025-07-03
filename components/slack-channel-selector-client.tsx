'use client'

import { updateSlackChannel } from '@everynews/app/actions/slack-channel'
import { SubmitButton } from '@everynews/components/submit-button'
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

interface SlackChannelSelectorClientProps {
  channelId: string
  channels: Array<{ id: string; name: string; is_private: boolean }>
}

const SlackSelectChannelSchema = z.object({
  channel: z.string().min(1, 'Please select a channel'),
})

type SlackSelectChannelForm = z.infer<typeof SlackSelectChannelSchema>

export const SlackChannelSelectorClient = ({
  channelId,
  channels,
}: SlackChannelSelectorClientProps) => {
  const form = useForm<SlackSelectChannelForm>({
    defaultValues: { channel: '' },
    resolver: zodResolver(SlackSelectChannelSchema),
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

    await updateSlackChannel(channelId, channel.id, channel.name)
  }

  // Check if no channels are available
  if (channels.length === 0) {
    return (
      <div className='space-y-3 sm:space-y-4'>
        <div>
          <label
            htmlFor='slack-channel'
            className='text-xs sm:text-sm font-medium'
          >
            Select Slack Channel
          </label>
          <Select disabled>
            <SelectTrigger id='slack-channel' disabled>
              <SelectValue placeholder='No channels available' />
            </SelectTrigger>
          </Select>
          <p className='mt-2 text-xs sm:text-sm text-muted-foreground'>
            Everynews is not invited to any channels yet. Could you invite us so
            that we can send alerts?
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

      <SubmitButton
        loading={form.formState.isSubmitting}
        disabled={!form.watch('channel')}
        className='w-full sm:w-auto'
        type='submit'
      >
        Save Channel
      </SubmitButton>
    </form>
  )
}
