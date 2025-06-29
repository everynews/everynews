'use client'

import { api } from '@everynews/app/api'
import { ChannelStatusBadge } from '@everynews/components/channel-status-badge'
import { SlackTestButton } from '@everynews/components/slack-test-button'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Input } from '@everynews/components/ui/input'
import { Separator } from '@everynews/components/ui/separator'
import { toastNetworkError } from '@everynews/lib/error'
import {
  type Channel,
  type ChannelDto,
  ChannelDtoSchema,
  SlackChannelConfigSchema,
} from '@everynews/schema/channel'
import { zodResolver } from '@hookform/resolvers/zod'
import { Slack } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const ChannelEditPage = ({ channel }: { channel: Channel }) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChannelDto>({
    defaultValues: channel,
    resolver: zodResolver(ChannelDtoSchema),
  })

  const onSubmit = async (values: ChannelDto) => {
    // Slack channels can't update destination through this form
    if (channel.type === 'slack') {
      setIsSubmitting(true)
      try {
        const parseResult = SlackChannelConfigSchema.safeParse(channel.config)
        if (!parseResult.success) {
          toast.error('Invalid Slack channel configuration')
          setIsSubmitting(false)
          return
        }
        const config = parseResult.data
        const res = await api.channels[':id'].$put({
          json: {
            config,
            name: values.name,
            type: 'slack' as const,
          },
          param: { id: channel.id },
        })

        if (!res.ok) {
          const errorData = await res.json()
          const errorMessage = errorData?.error || 'Failed to update channel'
          toast.error(errorMessage)
          return
        }

        toast.success(`Channel "${form.watch('name')}" updated.`)
        router.push('/my/channels')
      } catch (e) {
        toastNetworkError(e as Error)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Handle regular channels
    setIsSubmitting(true)
    try {
      const res = await api.channels[':id'].$put({
        json: values,
        param: { id: channel.id },
      })

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage = errorData?.error || 'Failed to update channel'
        toast.error(errorMessage)
        return
      }

      // Check if destination was changed
      const destinationChanged =
        channel.config.destination !== values.config.destination
      const wasVerified = channel.verified

      if (destinationChanged && wasVerified) {
        const destinationType =
          channel.type === 'phone' ? 'phone number' : 'email address'
        toast.success(`Channel "${form.watch('name')}" updated!`, {
          description: `Please verify the new ${destinationType} to receive alerts.`,
        })
      } else {
        toast.success(`Channel "${form.watch('name')}" updated.`)
      }

      router.push('/my/channels')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className='mb-4 sm:mb-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold'>Edit Channel</h1>
            <p className='text-muted-foreground mt-1'>
              Update your delivery channel settings
            </p>
          </div>
          <ChannelStatusBadge channel={channel} />
        </div>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4 sm:gap-6'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='My Email Channel' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {channel.type === 'slack' ? (
            <div className='space-y-4'>
              <div>
                <p className='text-xs sm:text-sm font-medium mb-2'>
                  Slack Configuration
                </p>
                <div className='rounded-lg border bg-muted/50 p-3 sm:p-4 space-y-2 sm:space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs sm:text-sm text-muted-foreground'>
                      Workspace
                    </span>
                    <span className='text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none'>
                      {channel.config.workspace?.name ||
                        channel.config.teamId ||
                        'Unknown'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs sm:text-sm text-muted-foreground'>
                      Channel
                    </span>
                    <span className='text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none'>
                      {channel.config.channel?.name
                        ? `#${channel.config.channel.name}`
                        : 'Not selected'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <Button asChild variant='outline' className='w-full'>
                  <Link href={`/channels/${channel.id}/slack-setup`}>
                    <Slack className='size-3 sm:size-4 mr-2' />
                    Change Slack Channel
                  </Link>
                </Button>
                <SlackTestButton
                  channel={channel}
                  variant='secondary'
                  className='w-full'
                />
                <p className='text-xs text-muted-foreground text-center'>
                  To connect a different workspace, create a new Slack channel
                </p>
              </div>
            </div>
          ) : (
            <FormField
              control={form.control}
              name='config.destination'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {channel.type === 'phone'
                      ? 'Phone Number'
                      : 'Email Address'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        channel.type === 'phone'
                          ? '+1234567890'
                          : 'you@example.com'
                      }
                      type={channel.type === 'phone' ? 'tel' : 'email'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className='flex flex-col-reverse sm:flex-row justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/my/channels')}
            >
              Cancel
            </Button>
            <SubmitButton
              onClick={form.handleSubmit(onSubmit)}
              loading={isSubmitting}
            >
              Update
            </SubmitButton>
          </div>
        </form>
      </Form>
    </>
  )
}
