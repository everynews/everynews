'use client'

import { auth } from '@everynews/auth/client'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@everynews/components/ui/card'
import { Input } from '@everynews/components/ui/input'
import { toastNetworkError } from '@everynews/lib/error'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SignInPage() {
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isGmail = contact.toLowerCase().endsWith('gmail.com')
    if (!contact) return
    try {
      setIsLoading(true)
      await auth.signIn.magicLink({ email: contact })
      toast.success('Check Your Email', {
        ...(isGmail && {
          action: {
            label: 'Open Gmail',
            onClick: () => window.open('https://mail.google.com', '_blank'),
          },
        }),
      })
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type='email'
              placeholder='elon@x.com'
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
            <SubmitButton onClick={handleSubmit} loading={isLoading} className="w-full">
              Sign In
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}