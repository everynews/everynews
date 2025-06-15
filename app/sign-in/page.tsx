'use client'

import { auth } from '@everynews/auth/client'
import { SubmitButton } from '@everynews/components/submit-button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import { toastNetworkError } from '@everynews/lib/error'
import MetaKeyIcon from '@everynews/lib/meta-key'
import { CornerDownLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'



export default function SignInPage() {
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFeelingLuckyLoading, setIsFeelingLuckyLoading] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === "Enter" || event.key === "s" || event.key === "S")) {
        event.preventDefault();
        handleSubmit({ contact, isFeelingLucky: true })
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [contact]);


  const handleSubmit = async ({
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
      await auth.signIn.magicLink({ email: contact })
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
  }

  return (
    <div className="flex items-center justify-center bg-background p-4 my-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to every.news</CardTitle>
          <CardDescription>
            By logging in, you agree to our{' '}
            <Link href='/terms' className='text-blue-500'>
              terms of service
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={() => handleSubmit({ contact, isFeelingLucky: false })} className="space-y-4">
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
              <SubmitButton onClick={() => handleSubmit({ contact, isFeelingLucky: false })} loading={isLoading} variant='outline'>
                Sign In
              </SubmitButton>
              <SubmitButton onClick={() => handleSubmit({ contact, isFeelingLucky: true })} loading={isFeelingLuckyLoading}>
                <div className='flex items-center gap-1'> 
                I&apos;m feeling lucky
                <span className='flex items-center'>
                <MetaKeyIcon className='size-3' />
                <CornerDownLeft className="size-3" />
                </span> 
                </div>
              </SubmitButton>
          </CardFooter>
      </Card>
    </div>
  )
}