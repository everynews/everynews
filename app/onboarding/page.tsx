'use client'

import { api } from '@everynews/app/api'
import { AlertPreview } from '@everynews/components/alert-preview'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@everynews/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import { type AlertDto, AlertDtoSchema } from '@everynews/schema/alert'
import type { Story } from '@everynews/schema/story'
import { StorySchema } from '@everynews/schema/story'
import { zodResolver } from '@hookform/resolvers/zod'
import { humanId } from 'human-id'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

const INTEREST_CHIPS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Cybersecurity',
  'Cloud Computing',
  'Blockchain',
  'Data Science',
  'DevOps',
  'Mobile Development',
  'Quantum Computing',
]

const searchableProviders = ['exa']

export default function OnboardingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<Story[] | null>(null)

  const form = useForm<AlertDto>({
    defaultValues: {
      active: true,
      description: 'Your personalized AI-curated alert',
      isPublic: false,
      language: 'en',
      name: humanId({ capitalize: false, separator: '-' }),
      promptId: null,
      strategy: { provider: 'exa', query: '' },
      threshold: 70,
      wait: { type: 'count', value: 10 },
    },
    resolver: zodResolver(AlertDtoSchema),
  })

  const onTest = async () => {
    const values = form.getValues()
    
    if (!values.strategy.query?.trim()) {
      form.setError('strategy.query', {
        message: 'Please enter what you are interested in',
        type: 'manual',
      })
      return
    }

    setIsTesting(true)
    setTestResults(null)

    try {
      const apiData: AlertDto = {
        ...values,
        strategy: searchableProviders.includes(values.strategy.provider)
          ? {
              provider: values.strategy.provider,
              query: values.strategy.query,
            }
          : values.strategy,
      }
      
      const res = await api.drill.$post({ json: apiData })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        toast.error('Failed to test alert', {description: JSON.stringify(errorData)})
        return
      }

      const storiesData = await res.json()
      const stories = storiesData.map((story: unknown) =>
        StorySchema.parse(story),
      )
      setTestResults(stories)
      toast.success(`Test completed. Found ${stories.length} stories.`)
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (values: AlertDto) => {
    if (!values.strategy.query?.trim()) {
      form.setError('strategy.query', {
        message: 'Please enter what you are interested in',
        type: 'manual',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const apiData: AlertDto = {
        ...values,
        strategy: searchableProviders.includes(values.strategy.provider)
          ? {
              provider: values.strategy.provider,
              query: values.strategy.query,
            }
          : values.strategy,
      }

      const res = await api.alerts.$post({ json: apiData })

      if (!res.ok) {
        toast.error('Failed to create your alert')
        return
      }

      toast.success('Alert created successfully!')
      router.push('/my/alerts')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChipClick = (interest: string) => {
    const currentQuery = form.getValues('strategy.query') || ''
    const newQuery = currentQuery ? `${currentQuery}, ${interest}` : interest
    form.setValue('strategy.query', newQuery, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <div className='container max-w-3xl mx-auto py-12'>
      <Card className='p-8'>
        <CardHeader>
          <CardTitle>Welcome to Everynews</CardTitle>
          <CardDescription>
            Let's test your personalized AI alert before creating it!
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='space-y-4'>
              

              <div className='flex flex-wrap gap-2 mb-4'>
                {INTEREST_CHIPS.map((interest) => (
                  <Button
                    key={interest}
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => handleChipClick(interest)}
                    className='rounded-full'
                  >
                    {interest}
                  </Button>
                ))}
              </div>

              <FormField
                control={form.control}
                name='strategy.query'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='sr-only'>Your interests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='What are you interested in?'
                        className='min-h-24'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {testResults && testResults.length > 0 && (
              <div className='mt-6 p-4 bg-muted/50 rounded-lg'>
                <h3 className='text-sm font-semibold mb-4'>Preview Results</h3>
                <AlertPreview stories={testResults} />
              </div>
            )}

            <div className='flex justify-between gap-4'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => router.push('/')}
              >
                Skip for now
              </Button>
              <div className='flex gap-2'>
                {!testResults && (
                  <SubmitButton
                    variant='outline'
                    loading={isTesting}
                    onClick={onTest}
                  >
                    Test Alert
                  </SubmitButton>
                )}
                {testResults && testResults.length > 0 && (
                  <SubmitButton
                    loading={isSubmitting}
                    size='lg'
                    onClick={() => form.handleSubmit(onSubmit)}
                  >
                    Looks Good
                  </SubmitButton>
                )}
              </div>
            </div>
          </form>
        </Form>
        </CardContent>  
      </Card>
    </div>
  )
}
