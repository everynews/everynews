'use client'

import { api } from '@everynews/app/api'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import { Card } from '@everynews/components/ui/card'
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

export default function OnboardingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AlertDto>({
    defaultValues: {
      active: true,
      description: 'Your personalized AI-curated newsletter',
      isPublic: false,
      language: 'en',
      name: `my-${humanId({ capitalize: false, separator: '-' })}-newsletter`,
      promptId: null,
      strategy: { provider: 'exa', query: '' },
      wait: { type: 'count', value: 10 },
    },
    resolver: zodResolver(AlertDtoSchema),
  })

  const onSubmit = async (values: AlertDto) => {
    if (!values.strategy.query?.trim()) {
      form.setError('strategy.query', {
        type: 'manual',
        message: 'Please enter what you are interested in',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const apiData: AlertDto = {
        ...values,
        strategy: { provider: 'exa', query: values.strategy.query },
      }

      const res = await api.alerts.$post({ json: apiData })

      if (!res.ok) {
        toast.error('Failed to create your newsletter')
        return
      }

      toast.success('Newsletter created successfully!')
      router.push('/my/alerts')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChipClick = (interest: string) => {
    const currentQuery = form.getValues('strategy.query') || ''
    const newQuery = currentQuery
      ? `${currentQuery}, ${interest}`
      : interest
    form.setValue('strategy.query', newQuery, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <div className='container max-w-3xl mx-auto py-12'>
      <Card className='p-8'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='space-y-4'>
            
              <h1 className='text-4xl font-bold mb-2'>Welcome to Everynews</h1>
        <p className='text-lg text-muted-foreground'>
          Let's create your personalized AI newsletter in seconds!
        </p>

              
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

            <div className='flex justify-between gap-4'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => router.push('/')}
              >
                Skip for now
              </Button>
              <SubmitButton loading={isSubmitting} size='lg' onClick={() => form.handleSubmit(onSubmit)}>
                Create My Newsletter
              </SubmitButton>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
}