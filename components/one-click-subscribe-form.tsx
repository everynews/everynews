'use client'

import { auth } from '@everynews/auth/client'
import { SubmitButton } from '@everynews/components/submit-button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import { CheckCircle2, Mail } from 'lucide-react'
import { useState } from 'react'

interface OneClickSubscribeFormProps {
  alert: Alert
  className?: string
}

export const OneClickSubscribeForm = ({
  alert,
  className,
}: OneClickSubscribeFormProps) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setIsLoading(true)
      await auth.signIn.magicLink(
        {
          callbackURL: `/subscriptions/success?alertId=${alert.id}`,
          email,
        },
        {
          headers: {
            'X-Alert-Id': alert.id,
            'X-Alert-Name': encodeURIComponent(alert.name),
            'X-Subscription-Flow': 'true',
          },
        },
      )
      setIsEmailSent(true)
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <Card className={className}>
        <CardContent className='p-4'>
          <div className='flex flex-col items-center text-center gap-2'>
            <div className='flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
              <CheckCircle2 className='size-4 text-green-600 dark:text-green-400' />
            </div>
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>Subscription email sent!</p>
              <div className='flex items-center justify-center gap-1 text-xs text-muted-foreground'>
                <Mail className='size-3' />
                <span>{email}</span>
              </div>
              <p className='text-xs text-muted-foreground'>
                Check your email to confirm your subscription.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className='flex gap-2'>
        <Input
          type='email'
          placeholder='Enter your email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className='text-sm'
        />
        <SubmitButton onClick={() => {}} loading={isLoading} size='sm'>
          Subscribe
        </SubmitButton>
      </div>
      <p className='text-xs text-muted-foreground mt-2'>
        No Sign-In needed. One-Click Subscribe.
      </p>
    </form>
  )
}
