'use client'

import { api } from '@everynews/app/api'
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
import { Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ScalingLoader } from './scaling-loader'
import { PageHeader } from './ui/page-header'

export const ChannelForm = ({
  mode,
  original,
}: {
  mode: 'create' | 'edit'
  original?: Channel
}) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createValues: ChannelDto = {
    config: { destination: '' },
    name: '',
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
        toast.error(`Failed to ${mode} channel`)
        return
      }

      toast.success(
        mode === 'create'
          ? `Channel "${form.watch('name')}" Created.`
          : `Channel "${form.watch('name')}" Updated.`,
      )
      router.push('/channels')
      router.refresh()
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader title={form.watch('name') || 'New Channel'} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 p-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem className='md:flex md:items-center md:justify-between'>
                <div className='md:w-1/2'>
                  <FormLabel className='text-lg'>
                    What should we call this channel?
                  </FormLabel>
                </div>
                <div className='md:w-1/2'>
                  <FormControl>
                    <Input placeholder='My Email Channel' {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name='config.destination'
            render={({ field }) => (
              <FormItem className='md:flex md:items-center md:justify-between'>
                <div className='md:w-1/2'>
                  <FormLabel className='text-lg'>Email Address</FormLabel>
                </div>
                <div className='md:w-1/2'>
                  <FormControl>
                    <Input placeholder='you@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className='flex justify-end'>
            <Link href='/channels'>
              <Button type='button' variant='outline' className='mr-2'>
                Cancel
              </Button>
            </Link>
            <Button type='submit' disabled={isSubmitting} className='flex'>
              <Save className='size-4' />
              {mode === 'create' ? 'Create' : 'Update'}
              <ScalingLoader loading={isSubmitting} />
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
