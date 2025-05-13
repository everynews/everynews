'use client'

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
import type { News } from '@everynews/drizzle/types'
import {
  type UpdateNewsDto,
  updateNewsDtoSchema,
} from '@everynews/dto/news/update'
import { toastNetworkError } from '@everynews/lib/error'
import { api } from '@everynews/server/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const EditNewsForm = ({ news }: { news: News }) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      active: news.active,
      name: news.name,
      public: news.public || false,
      strategy: {
        provider: news.strategy.provider,
        query: news.strategy.query,
      },
      wait: {
        count: news.wait.count,
        cron: news.wait.cron,
      },
    },
    resolver: zodResolver(updateNewsDtoSchema),
  })

  const onSubmit = async (values: UpdateNewsDto) => {
    setIsSubmitting(true)
    try {
      const res = await api.news[':id'].$put({
        json: {
          active: values.active,
          name: values.name,
          public: values.public,
          strategy: values.strategy,
          wait: {
            count: values.wait.count,
            cron: values.wait.cron,
          },
        },
        param: { id: news.id },
      })

      const { data, error, message } = await res.json()

      if (data) {
        toast.success(message)
        router.push('/news')
        router.refresh()
      } else {
        toast.error(error?.message)
      }
    } catch (e) {
      toastNetworkError(e as Error)
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
          name='strategy.provider'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <Input placeholder='Provider' {...field} />
              </FormControl>
              <FormDescription>
                Enter provider (e.g., hn for HackerNews or query for Web Search)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='strategy.query'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search Query</FormLabel>
              <FormControl>
                <Input
                  placeholder='Enter your search query'
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
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
          name='public'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormLabel>Public</FormLabel>
              <FormControl>
                <input
                  type='checkbox'
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className='h-4 w-4'
                />
              </FormControl>
              <FormDescription>
                Make this news item visible to everyone
              </FormDescription>
              <FormMessage />
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
            Update News Item
          </Button>
        </div>
      </form>
    </Form>
  )
}
