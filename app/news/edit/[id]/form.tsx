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
import { toastNetworkError } from '@everynews/lib/error'
import type { News } from '@everynews/schema/news'
import { type NewsDto, NewsDtoSchema } from '@everynews/schema/news'
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
      isPublic: news.isPublic,
      name: news.name,
      strategy: {
        provider: news.strategy.provider,
        query: 'query' in news.strategy ? news.strategy.query : undefined,
      },
      wait: {
        count: news.wait.count,
        cron: news.wait.cron,
      },
    },
    resolver: zodResolver(NewsDtoSchema),
  })

  const onSubmit = async (values: NewsDto) => {
    setIsSubmitting(true)
    try {
      const res = await api.news[':id'].$put({
        json: {
          active: values.active,
          isPublic: values.isPublic,
          name: values.name,
          strategy: values.strategy,
          wait: {
            count: values.wait.count,
            cron: values.wait.cron,
          },
        },
        param: { id: news.id },
      })
      if (!res.ok) {
        toast.error('Failed to update news')
        return
      }
      toast.success('News Updated Successfully')
      router.push('/news')
      router.refresh()
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
          name='isPublic'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormLabel>isPublic</FormLabel>
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
