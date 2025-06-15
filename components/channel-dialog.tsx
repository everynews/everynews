'use client'

import { api } from '@everynews/app/api'
import { FormFieldRow } from '@everynews/components/form-field-row'
import { Button } from '@everynews/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@everynews/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
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
import { humanId } from 'human-id'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'

export const ChannelDialog = ({
  mode,
  original,
  trigger,
}: {
  mode: 'create' | 'edit'
  original?: Channel
  trigger?: React.ReactNode
}) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const createValues: ChannelDto = {
    config: { destination: '' },
    name: humanId({ capitalize: false, separator: '-' }),
    type: 'email',
  }

  const form = useForm<ChannelDto>({
    defaultValues:
      mode === 'create'
        ? createValues
        : {
            config: original?.config || { destination: '' },
            name: original?.name || '',
            type: original?.type || 'email',
          },
    resolver: zodResolver(ChannelDtoSchema),
  })

  const onSubmit = async (values: ChannelDto) => {
    setIsSubmitting(true)
    try {
      let res: Response
      if (mode === 'create') {
        res = await api.channels.$post({ json: values })
      } else {
        if (!original?.id) {
          toast.error('Missing channel ID for update')
          return
        }
        res = await api.channels[':id'].$put({
          json: values,
          param: { id: original.id },
        })
      }

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage = errorData?.error || `Failed to ${mode} channel`
        toast.error(errorMessage)
        return
      }

      if (mode === 'create') {
        // Get the created channel from response
        const createdChannel = await res.json()
        const channelId = Array.isArray(createdChannel)
          ? createdChannel[0]?.id
          : createdChannel?.id

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
      } else {
        // Check if email was changed for update mode
        const emailChanged =
          original?.config.destination !== values.config.destination
        const wasVerified = original?.verified

        if (emailChanged && wasVerified) {
          toast.success(`Channel "${form.watch('name')}" updated!`, {
            description:
              'Please verify the new email address to receive alerts.',
          })
        } else {
          toast.success(`Channel "${form.watch('name')}" updated.`)
        }
      }

      setOpen(false)
      if (mode === 'create') {
        form.reset({
          ...createValues,
          name: humanId({ capitalize: false, separator: '-' }),
        })
      } else {
        form.reset()
      }
      router.refresh()
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = <Button>Create Channel</Button>

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Channel' : 'Edit Channel'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-6'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormFieldRow
                  label='What should we call this channel?'
                  labelWidth='1/2'
                >
                  <FormControl>
                    <Input placeholder='My Email Channel' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormFieldRow>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name='config.destination'
              render={({ field }) => (
                <FormFieldRow label='Email Address' labelWidth='1/2'>
                  <FormControl>
                    <Input placeholder='you@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormFieldRow>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton
                onClick={form.handleSubmit(onSubmit)}
                loading={isSubmitting}
              >
                {mode === 'create' ? 'Create' : 'Update'}
              </SubmitButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
