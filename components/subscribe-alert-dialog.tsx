'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { Combobox } from '@everynews/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@everynews/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import type { Channel } from '@everynews/schema/channel'
import { SlackChannelConfigSchema } from '@everynews/schema/channel'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { SubmitButton } from './submit-button'

const SubscribeFormSchema = z.object({
  channelId: z.string(),
})

type SubscribeFormData = z.infer<typeof SubscribeFormSchema>

export const SubscribeAlertDialog = ({
  alert,
  channels,
  children,
  user,
  subscribedChannelIds = [],
  hasDefaultSubscription = false,
}: {
  alert: Alert
  channels: Channel[]
  children: React.ReactNode
  user?: { id: string; email: string; createdAt: Date }
  subscribedChannelIds?: string[]
  hasDefaultSubscription?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<SubscribeFormData>({
    defaultValues: {
      channelId: '',
    },
    resolver: zodResolver(SubscribeFormSchema),
  })

  // Filter out already subscribed channels
  const availableChannels = channels.filter(
    (channel) => !subscribedChannelIds.includes(channel.id),
  )

  const onSubmit = async (data: SubscribeFormData) => {
    setLoading(true)
    try {
      const response = await api.subscriptions.$post({
        json: {
          alertId: alert.id,
          channelId: data.channelId === 'default' ? null : data.channelId,
        },
      })

      if (!response.ok) {
        toast.error('Failed to subscribe to alert')
        return
      }

      const selectedChannel =
        data.channelId === 'default'
          ? 'default email'
          : availableChannels.find((ch) => ch.id === data.channelId)?.name ||
            'channel'

      toast.success(
        `Successfully subscribed to "${alert.name}" via ${selectedChannel}`,
      )
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Subscribe to "{alert.name}"</DialogTitle>
          <DialogDescription>
            Choose a channel to receive notifications for this alert.
            {subscribedChannelIds.length > 0 && (
              <span className='block mt-2 text-xs'>
                Already subscribed: {subscribedChannelIds.length} channel
                {subscribedChannelIds.length !== 1 && 's'}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
          >
            <FormField
              control={form.control}
              name='channelId'
              render={({ field }) => {
                const comboboxOptions = [
                  ...(user && !hasDefaultSubscription
                    ? [
                        {
                          label: `Default Channel (email: ${user.email})`,
                          value: 'default',
                        },
                      ]
                    : []),
                  ...availableChannels.map((channel) => {
                    const configDisplay =
                      channel.type === 'slack'
                        ? (() => {
                            const parsed = SlackChannelConfigSchema.safeParse(
                              channel.config,
                            )
                            if (parsed.success) {
                              return `#${parsed.data.channel?.name || 'Unknown channel'}`
                            }
                            return 'Not configured'
                          })()
                        : (() => {
                            const parsed = z
                              .object({ destination: z.string() })
                              .safeParse(channel.config)
                            if (parsed.success) {
                              return parsed.data.destination
                            }
                            return 'Not configured'
                          })()

                    return {
                      label: `${channel.name} (${channel.type}: ${configDisplay})`,
                      value: channel.id,
                    }
                  }),
                ]

                return (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <FormControl>
                      <Combobox
                        options={comboboxOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a channel'
                        searchPlaceholder='Search channels...'
                        emptyText='No channels found.'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <SubmitButton
                onClick={form.handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading || !form.watch('channelId')}
              >
                Subscribe
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
