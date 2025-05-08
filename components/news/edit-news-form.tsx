'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
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
import { Switch } from '@everynews/components/ui/switch'
import { Textarea } from '@everynews/components/ui/textarea'
import { News, newsSchema } from '@everynews/drizzle/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface EditNewsFormProps {
  news: News
}

export const EditNewsForm = ({ news }: EditNewsFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set up form with news data
  const form = useForm<News>({
    defaultValues: news,
    resolver: zodResolver(newsSchema),
  })

  // Update form when news changes
  useEffect(() => {
    if (news) {
      form.reset(news)
    }
  }, [news, form])

  const onSubmit = async (values: News) => {
    setIsSubmitting(true)
    try {
      // Prepare update data, preserving existing fields
      const updatedData = {
        ...news,
        isActive: values.isActive ?? news.isActive,
        name: values.name,
        searchQuery:
          typeof values.searchQuery === 'string'
            ? { filters: {}, provider: 'google', query: values.searchQuery }
            : values.searchQuery,
        updatedAt: new Date(),
      }

      const response = await api.news[':id'].$put({
        json: updatedData,
        param: { id: news.id },
      })

      if (response.ok) {
        toast.success('Updated', {
          description: 'News item updated successfully.',
        })
        router.push('/news')
        router.refresh()
      } else {
        const errorData = await response.json()
        toast.error('Error', {
          description: errorData.error || 'Failed to update news item',
        })
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An error occurred while updating the news item',
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
              name='searchQuery'
              render={({ field }) => {
                const query =
                  typeof field.value === 'string'
                    ? field.value
                    : field.value?.query || ''

                return (
                  <FormItem>
                    <FormLabel>Search Query</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='artificial intelligence OR machine learning'
                        className='min-h-[100px]'
                        value={query}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter keywords or phrases to search for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )
              }}
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
                      checked={field.value ?? false}
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
                Update News Item
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
