'use client'

import { api } from '@everynews/app/api'
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
  type ChannelDto,
  ChannelDtoSchema,
  ChannelSchema,
} from '@everynews/schema/channel'
import { zodResolver } from '@hookform/resolvers/zod'
import { humanId } from 'human-id'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const ChannelCreatePage = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChannelDto>({
    defaultValues: {
      config: { destination: '' },
      name: humanId({ capitalize: false, separator: '-' }),
      type: 'email',
    },
    resolver: zodResolver(ChannelDtoSchema),
  })

  const onSubmit = async (values: ChannelDto) => {
    setIsSubmitting(true)
    try {
      const res = await api.channels.$post({ json: values })

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage = errorData?.error || 'Failed to create channel'
        toast.error(errorMessage)
        return
      }

      const createdChannel = ChannelSchema.parse(await res.json())
      const channelId = createdChannel?.id

      if (channelId) {
        // Automatically send verification email for new channels
        try {
          await api.channels[':id']['send-verification'].$post({
            param: { id: channelId },
          })
          toast.success(
            `Channel "${form.watch('name')}" created! Verification email sent.`,
          )
        } catch (error) {
          toast.success(
            `Channel "${form.watch('name')}" created, but failed to send verification email.
            Please send verification email manually.`,
            {
              description: JSON.stringify(error),
            },
          )
        }
      } else {
        toast.success(`Channel "${form.watch('name')}" created.`)
      }

      router.push('/my/channels')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='container mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Create Channel</h1>
        <p className='text-muted-foreground mt-1'>
          Add a new delivery channel for your alerts
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-6'
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

          <FormField
            control={form.control}
            name='config.destination'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder='you@example.com' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2'>
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
              Create
            </SubmitButton>
          </div>
        </form>
      </Form>
    </div>
  )
}
