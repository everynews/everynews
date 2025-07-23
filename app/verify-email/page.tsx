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
import { toastNetworkError } from '@everynews/lib/error'
import { CheckCircle2, Mail, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setError('Invalid verification link')
      setIsVerifying(false)
      return
    }

    try {
      await auth.verifyEmail({
        query: {
          token,
        },
      })
      setIsVerified(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (_e) {
      setError('Verification failed. The link may have expired.')
    } finally {
      setIsVerifying(false)
    }
  }, [token, router])

  const resendVerificationEmail = useCallback(async () => {
    try {
      setIsResending(true)
      const { data: session } = await auth.getSession()
      if (session?.user?.email) {
        await auth.sendVerificationEmail({
          email: session.user.email,
        })
        setError(null)
      }
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsResending(false)
    }
  }, [])

  useEffect(() => {
    verifyEmail()
  }, [verifyEmail])

  if (isVerifying) {
    return (
      <div className='flex items-center justify-center bg-background p-4 my-10'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle>Verifying your email...</CardTitle>
            <CardDescription>
              Please wait while we verify your email address
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className='flex items-center justify-center bg-background p-4 my-10'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
              <CheckCircle2 className='size-6 text-green-600 dark:text-green-400' />
            </div>
            <CardTitle>Email verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
            <XCircle className='size-6 text-red-600 dark:text-red-400' />
          </div>
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>{error || 'Something went wrong'}</CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <div className='mb-4 flex items-center justify-center gap-2 rounded-lg bg-muted p-3'>
            <Mail className='size-4 text-muted-foreground' />
            <span className='text-sm text-muted-foreground'>
              Need a new verification email?
            </span>
          </div>
          <SubmitButton
            onClick={resendVerificationEmail}
            loading={isResending}
            variant='outline'
            className='w-full'
          >
            Resend verification email
          </SubmitButton>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <Link
            href='/'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            Go to homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
