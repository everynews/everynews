'use client'

import { updateDiscordChannel } from '@everynews/app/actions/discord-channel'
import { SubmitButton } from '@everynews/components/submit-button'
import { Combobox } from '@everynews/components/ui/combobox'
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
          <Combobox
            options={[]}
            value={null}
            placeholder='No channels available'
            disabled
          />
          <p className='mt-2 text-xs sm:text-sm text-muted-foreground'>
            No text channels found in your Discord server. Please create a text
            channel first.
          </p>
        </div>
      </div>
    )
  }

  const comboboxOptions = channels.map((channel) => ({
    label: `#${channel.name}`,
    value: channel.id,
  }))

  return (
    <form action={handleSubmit} className='space-y-3 sm:space-y-4'>
      <div>
        <input type='hidden' name='channel' value={form.watch('channel')} />
        <Combobox
          options={comboboxOptions}
          value={form.watch('channel')}
          onValueChange={(value) =>
            form.setValue('channel', value || '', { shouldValidate: true })
          }
          placeholder='Choose a channel'
          searchPlaceholder='Search channels...'
          emptyText='No channel found.'
        />
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
