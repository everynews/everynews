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
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import type { NewsDto } from '@everynews/schema/news'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const createFormSchema = z.object({
  active: z.boolean(),
  name: z.string().min(1, 'Name is required'),
  query: z.string().min(2, 'Search query is required'),
})

type CreateFormValues = z.infer<typeof createFormSchema>

export const CreateNewsForm = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues: CreateFormValues = {
    active: true,
    name: '',
    query: '',
  }

  const form = useForm<CreateFormValues>({
    defaultValues,
    resolver: zodResolver(createFormSchema),
  })

  const onSubmit = async (values: CreateFormValues) => {
    setIsSubmitting(true)
    try {
      const apiData: NewsDto = {
        active: values.active,
        isPublic: false,
        name: values.name,
        strategy: {
          provider: 'exa',
          query: values.query,
        },
        wait: {
          type: 'count',
          value: 10,
        },
      }
      const res = await api.news.$post({
        json: apiData,
      })
      if (!res.ok) {
        toast.error('Failed to create news')
        return
      }
      toast.success('News Created Successfully')
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
