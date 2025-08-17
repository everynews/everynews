'use client'

import { auth } from '@everynews/auth/client'
import { SubmitButton } from '@everynews/components/submit-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import { Label } from '@everynews/components/ui/label'
import { toastNetworkError } from '@everynews/lib/error'
import { CheckCircle2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useId, useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const emailId = useId()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email) return

      try {
        setIsLoading(true)
        await auth.forgetPassword({
          email,
          redirectTo: '/reset-password',
        })
        setIsEmailSent(true)
      } catch (e) {
        toastNetworkError(e as Error)
      } finally {
        setIsLoading(false)
      }
    },
    [email],
  )

  if (isEmailSent) {
    return (
      <div className='flex items-center justify-center bg-background p-4 my-10'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
              <CheckCircle2 className='size-6 text-green-600 dark:text-green-400' />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='mb-4 flex items-center justify-center gap-2 rounded-lg bg-muted p-3'>
              <Mail className='size-4 text-muted-foreground' />
              <span className='font-medium'>{email}</span>
            </div>
            <p className='text-sm text-muted-foreground'>
              If an account exists for this email, you&apos;ll receive a
              password reset link shortly.
            </p>
          </CardContent>
          <CardFooter className='flex justify-center'>
            <Link
              href='/sign-in'
              className='text-sm text-muted-foreground hover:text-foreground'
            >
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor={emailId}>Email</Label>
              <Input
                id={emailId}
                type='email'
                placeholder='elon@x.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <SubmitButton type='submit' loading={isLoading} className='w-full'>
              Send reset link
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            Remember your password?{' '}
            <Link href='/sign-in' className='text-orange-500 hover:underline'>
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
