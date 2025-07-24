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
import { Separator } from '@everynews/components/ui/separator'
import { toastNetworkError } from '@everynews/lib/error'
import { CheckCircle2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const searchParams = useSearchParams()
  const callback = searchParams.get('callback')
  const router = useRouter()

  const handlePasswordSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email || !password) return

      try {
        setIsLoading(true)
        await auth.signIn.email({
          callbackURL: callback || '/',
          email,
          password,
        })
        const { data: session } = await auth.getSession()
        if (!session) {
          router.push('/email-verification-required')
          return
        }
        toast.success('Signed in successfully!')
        router.push(callback || '/')
      } catch (e) {
        toastNetworkError(e as Error)
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, callback, router],
  )

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleLoading(true)
      await auth.signIn.social({
        callbackURL: callback || '/',
        provider: 'google',
      })
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsGoogleLoading(false)
    }
  }, [callback])

  const handleMagicLink = useCallback(async () => {
    if (!email) return
    try {
      setIsMagicLinkLoading(true)
      await auth.signIn.magicLink({
        callbackURL: callback || '/sign-in/success',
        email,
      })
      setIsEmailSent(true)
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsMagicLinkLoading(false)
    }
  }, [email, callback])

  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      {isEmailSent ? (
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
              <CheckCircle2 className='size-6 text-green-600 dark:text-green-400' />
            </div>
            <CardTitle>Magic Link Sent!</CardTitle>
            <CardDescription>We&apos;ve sent a sign-in link to</CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <div className='mb-4 flex items-center justify-center gap-2 rounded-lg bg-muted p-3'>
              <Mail className='size-4 text-muted-foreground' />
              <span className='font-medium'>{email}</span>
            </div>
            <p className='text-sm text-muted-foreground'>
              The link will expire in 5 minutes.
            </p>
          </CardContent>
          <CardFooter className='flex justify-center'>
            <Link
              href='/sign-in'
              onClick={() => {
                setIsEmailSent(false)
                setEmail('')
              }}
              className='text-sm text-muted-foreground hover:text-foreground'
            >
              Try a different email
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to your every.news account
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form onSubmit={handlePasswordSignIn} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='elon@x.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='password'>Password</Label>
                  <Link
                    href='/forgot-password'
                    className='text-xs text-orange-500 hover:underline'
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <SubmitButton
                type='submit'
                loading={isLoading}
                className='w-full'
              >
                Sign in
              </SubmitButton>
            </form>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <Separator />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='px-2 text-muted-foreground bg-card'>
                  Or continue with
                </span>
              </div>
            </div>

            <div className='grid gap-2'>
              <SubmitButton
                onClick={handleGoogleSignIn}
                loading={isGoogleLoading}
                variant='outline'
                className='w-full'
              >
                <svg
                  className='mr-2 size-4'
                  aria-hidden='true'
                  focusable='false'
                  data-prefix='fab'
                  data-icon='google'
                  role='img'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 488 512'
                >
                  <path
                    fill='currentColor'
                    d='M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z'
                  />
                </svg>
                Google
              </SubmitButton>

              <SubmitButton
                onClick={handleMagicLink}
                loading={isMagicLinkLoading}
                variant='outline'
                className='w-full'
                disabled={!email}
              >
                <Mail className='mr-2 size-4' />
                Sign-in Link
              </SubmitButton>
            </div>
          </CardContent>
          <CardFooter className='flex flex-col gap-2'>
            <p className='text-xs text-center text-muted-foreground'>
              By signing in, you agree to our{' '}
              <Link href='/terms' className='text-orange-500 hover:underline'>
                terms of service
              </Link>
            </p>
            <p className='text-sm text-center text-muted-foreground'>
              Don't have an account?{' '}
              <Link href='/sign-up' className='text-orange-500 hover:underline'>
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
