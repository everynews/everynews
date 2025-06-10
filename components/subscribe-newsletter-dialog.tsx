'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@everynews/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { toastNetworkError } from '@everynews/lib/error'
import type { Channel } from '@everynews/schema/channel'
import type { Newsletter } from '@everynews/schema/newsletter'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { SubmitButton } from './submit-button'

const SubscribeFormSchema = z.object({
  channelId: z.string().min(1, 'Please select a channel'),
})

type SubscribeFormData = z.infer<typeof SubscribeFormSchema>

export const SubscribeNewsletterDialog = ({
  newsletter,
  channels,
  children,
}: {
  newsletter: Newsletter
  channels: Channel[]
  children: React.ReactNode
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

  const onSubmit = async (data: SubscribeFormData) => {
    setLoading(true)
    try {
      const response = await api.subscriptions.$post({
        json: {
          channelId: data.channelId,
          newsletterId: newsletter.id,
          userId: '', // This will be handled server-side
        },
      })

      if (!response.ok) {
        toast.error('Failed to subscribe to newsletter')
        return
      }

      toast.success(`Successfully subscribed to "${newsletter.name}"`)
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
          <DialogTitle>Subscribe to "{newsletter.name}"</DialogTitle>
          <DialogDescription>
            Choose a channel to receive notifications for this newsletter.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='channelId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className='w-full justify-between'
                        >
                          {field.value
                            ? channels.find((c) => c.id === field.value)?.name
                            : 'Select a channel'}
                        </Button>
                      </FormControl>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-full'>
                      {channels.map((channel) => (
                        <DropdownMenuItem
                          key={channel.id}
                          onClick={() => field.onChange(channel.id)}
                        >
                          {channel.name} ({channel.type})
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )}
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
              <SubmitButton onClick={form.handleSubmit(onSubmit)} loading={loading} disabled={loading}>
                Subscribe
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
