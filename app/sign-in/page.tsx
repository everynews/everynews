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
import { toastNetworkError } from '@everynews/lib/error'
import MetaKeyIcon from '@everynews/lib/meta-key'
import { CheckCircle2, CornerDownLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function SignInPage() {
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFeelingLuckyLoading, setIsFeelingLuckyLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const searchParams = useSearchParams()
  const callback = searchParams.get('callback')

  const handleSubmit = useCallback(
    async ({
      contact,
      isFeelingLucky,
    }: {
      contact: string
      isFeelingLucky: boolean
    }) => {
      if (!contact) return
      try {
        if (isFeelingLucky) {
          setIsFeelingLuckyLoading(true)
        } else {
          setIsLoading(true)
        }
        await auth.signIn.magicLink({
          callbackURL: callback || '/sign-in/success',
          email: contact,
        })
        setIsEmailSent(true)
        if (isFeelingLucky) {
          if (window) {
            window.open(`https://${contact.split('@')[1]}`, '_blank')
          }
        }
      } catch (e) {
        toastNetworkError(e as Error)
      } finally {
        setIsLoading(false)
        setIsFeelingLuckyLoading(false)
      }
    },
    [callback],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        handleSubmit({ contact, isFeelingLucky: true })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [contact, handleSubmit])

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
              <span className='font-medium'>{contact}</span>
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
                setContact('')
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
            <CardTitle>Welcome to every.news</CardTitle>
            <CardDescription>
              By logging in, you agree to our{' '}
              <Link href='/terms' className='text-orange-500'>
                terms of service
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit({ contact, isFeelingLucky: false })
              }}
              className='flex flex-col gap-4'
            >
              <Input
                type='email'
                placeholder='elon@x.com'
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </form>
          </CardContent>
          <CardFooter className='flex justify-end gap-2'>
            <SubmitButton
              onClick={() => handleSubmit({ contact, isFeelingLucky: false })}
              loading={isLoading}
              variant='outline'
            >
              Sign In
            </SubmitButton>
            <SubmitButton
              onClick={() => handleSubmit({ contact, isFeelingLucky: true })}
              loading={isFeelingLuckyLoading}
            >
              <div className='flex items-center gap-1'>
                I&apos;m feeling lucky
                <span className='flex items-center'>
                  <MetaKeyIcon className='size-3' />
                  <CornerDownLeft className='size-3' />
                </span>
              </div>
            </SubmitButton>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
