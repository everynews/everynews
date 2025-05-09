'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Input } from '@everynews/components/ui/input'
import { toast } from '@everynews/components/ui/sonner'
import { Switch } from '@everynews/components/ui/switch'
import { Textarea } from '@everynews/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Simplified form schema for create form
const createFormSchema = z.object({
  isActive: z.boolean(),
  name: z.string().min(1, 'Name is required'),
  query: z.string().min(2, 'Search query is required'),
})

type CreateFormValues = z.infer<typeof createFormSchema>

export const CreateNewsForm = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default values for new news item
  const defaultValues: CreateFormValues = {
    isActive: true,
    name: '',
    query: '',
  }

  // Set up form with simplified schema
  const form = useForm<CreateFormValues>({
    defaultValues,
    resolver: zodResolver(createFormSchema),
  })

  const onSubmit = async (values: CreateFormValues) => {
    setIsSubmitting(true)
    try {
      const apiData = {
        isActive: values.isActive,
        name: values.name,
        strategy: {
          provider: 'kagi',
          query: values.query,
        },
        waitSettings: {
          timeSettings: {
            sendAt: '09:00',
            timezone: 'UTC',
          },
          type: 'time' as const,
        },
      }

      const response = await api.news.$post({
        json: apiData,
      })

      if (response.ok) {
        toast.success('Created', {
          description: 'News item created successfully.',
        })
        router.push('/news')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error('Error', {
          description: error || 'Failed to create news item',
        })
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An error occurred while creating the news item',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Daily Tech News' {...field} />
              </FormControl>
              <FormDescription>
                Give your news source a descriptive name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='query'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search Query</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='artificial intelligence OR machine learning'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter keywords or phrases to search for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='isActive'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this news source
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className='flex justify-end'>
          <Link href='/news'>
            <Button type='button' variant='outline' className='mr-2'>
              Cancel
            </Button>
          </Link>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            <Save className='mr-2 h-4 w-4' />
            Create News Item
          </Button>
        </div>
      </form>
    </Form>
  )
}
