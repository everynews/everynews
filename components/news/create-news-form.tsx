'use client'

import { News, newsSchema } from '@everynews/drizzle/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { hc } from 'hono/client'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api } from '../../app/api'
import { AppType } from '../../server/hono'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import { toast } from '../ui/sonner'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'

// Simplified form schema for create form
const createFormSchema = z.object({
  isActive: z.boolean(),
  name: z.string().min(1, 'Name is required'),
  searchQueryText: z.string().min(2, 'Search query is required'),
})

type CreateFormValues = z.infer<typeof createFormSchema>

export const CreateNewsForm = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Default values for new news item
  const defaultValues: CreateFormValues = {
    isActive: true,
    name: '',
    searchQueryText: '',
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
        createdAt: new Date(), // Add a unique ID
        id: crypto.randomUUID(),
        isActive: values.isActive,
        lastRun: null,
        lastSent: null,
        name: values.name,
        nextRun: null,
        relevanceSettings: {
          minScore: 0.7,
          weights: {
            content: 0.8,
            title: 1.0,
            url: 0.5,
          },
        },
        searchQuery: {
          filters: {},
          provider: 'google',
          query: values.searchQueryText,
        },
        updatedAt: new Date(),
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
        const errorData = await response.json()
        toast.error('Error', {
          description: errorData.error || 'Failed to create news item',
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
    <Card>
      <CardContent className='pt-6'>
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
              name='searchQueryText'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Query</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='artificial intelligence OR machine learning'
                      className='min-h-[100px]'
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
              <Button
                type='button'
                variant='outline'
                className='mr-2'
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                <Save className='mr-2 h-4 w-4' />
                Create News Item
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
