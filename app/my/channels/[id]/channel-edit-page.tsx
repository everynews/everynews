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
  type Channel,
  type ChannelDto,
  ChannelDtoSchema,
} from '@everynews/schema/channel'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const ChannelEditPage = ({ channel }: { channel: Channel }) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChannelDto>({
    defaultValues: {
      config: channel.config,
      name: channel.name,
      type: channel.type,
    },
    resolver: zodResolver(ChannelDtoSchema),
  })

  const onSubmit = async (values: ChannelDto) => {
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

      // Check if email was changed
      const emailChanged =
        channel.config.destination !== values.config.destination
      const wasVerified = channel.verified

      if (emailChanged && wasVerified) {
        toast.success(`Channel "${form.watch('name')}" updated!`, {
          description: 'Please verify the new email address to receive alerts.',
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
    <div className='container mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Edit Channel</h1>
        <p className='text-muted-foreground mt-1'>
          Update your delivery channel settings
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
              Update
            </SubmitButton>
          </div>
        </form>
      </Form>
    </div>
  )
}
