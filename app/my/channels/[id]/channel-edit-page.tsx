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
import { Slack } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const SlackConfigurationDisplay = ({ channel }: { channel: Channel }) => {
  if (channel.type !== 'slack') return null

  const config = SlackChannelConfigSchema.parse(channel.config)

  return (
    <div className='space-y-6'>
      <div>
        <p className='text-sm font-medium mb-3'>Slack Configuration</p>
        <div className='rounded-lg border bg-muted/50 p-4 md:p-6 space-y-3 md:space-y-4'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-sm text-muted-foreground'>Workspace</span>
            <span className='text-sm font-medium truncate max-w-[150px] md:max-w-xs'>
              {config.workspace?.name || config.teamId || 'Unknown'}
            </span>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-sm text-muted-foreground'>Channel</span>
            <span className='text-sm font-medium truncate max-w-[150px] md:max-w-xs'>
              {config.channel?.name
                ? `#${config.channel.name}`
                : 'Not selected'}
            </span>
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='flex flex-col md:flex-row gap-2 md:gap-3'>
          <Button asChild variant='outline' className='flex-1 md:flex-initial'>
            <Link href={`/channels/${channel.id}/slack-setup`}>
              <Slack className='size-4 mr-2' />
              Change Slack Channel
            </Link>
          </Button>
          <SlackTestButton
            channel={channel}
            className='flex-1 md:flex-initial'
          />
        </div>
        <p className='text-xs text-muted-foreground text-center md:text-left'>
          To connect a different workspace, create a new Everynews channel.
        </p>
      </div>
    </div>
  )
}

export const ChannelEditPage = ({ channel }: { channel: Channel }) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Transform Channel to ChannelDto - only include fields that can be edited
  const channelDto = {
    config: channel.config,
    name: channel.name,
    type: channel.type,
  } as ChannelDto

  const form = useForm<ChannelDto>({
    defaultValues: channelDto,
    resolver: async (data) => {
      const result = ChannelDtoSchema.safeParse(data)
      if (result.success) {
        return { errors: {}, values: result.data }
      }
      return {
        errors: Object.fromEntries(
          result.error.issues.map((issue) => [
            issue.path.join('.'),
            { message: issue.message, type: 'validation' },
          ]),
        ),
        values: {},
      }
    },
  })

  const onSubmit = async (values: ChannelDto) => {
    // Unknown channel types can't be edited
    if (
      channel.type !== 'email' &&
      channel.type !== 'phone' &&
      channel.type !== 'slack'
    ) {
      toast.error('This channel type cannot be edited')
      return
    }

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

      // Check if destination was changed for email/phone channels
      let destinationChanged = false
      if (
        (channel.type === 'email' || channel.type === 'phone') &&
        (values.type === 'email' || values.type === 'phone')
      ) {
        // Since we know the types, we can safely access destination
        const destinationSchema = z.object({ destination: z.string() })
        const oldParsed = destinationSchema.safeParse(channel.config)
        const newParsed = destinationSchema.safeParse(values.config)

        if (oldParsed.success && newParsed.success) {
          destinationChanged =
            oldParsed.data.destination !== newParsed.data.destination
        }
      }

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
      <div className='mb-6 md:mb-8'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold'>Edit Channel</h1>
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
          className='flex flex-col gap-6 md:gap-8'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='My Email Channel'
                    {...field}
                    className='md:max-w-md'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {channel.type === 'slack' ? (
            <SlackConfigurationDisplay channel={channel} />
          ) : channel.type === 'email' || channel.type === 'phone' ? (
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
                      className='md:max-w-md'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className='rounded-lg border bg-muted/50 p-4 md:p-6'>
              <p className='text-sm text-muted-foreground'>
                This channel type is not currently supported for editing.
              </p>
            </div>
          )}

          <div className='flex flex-col-reverse md:flex-row justify-end gap-2 pt-4'>
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
