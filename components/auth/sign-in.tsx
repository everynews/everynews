'use client'

import { auth } from '@everynews/auth/client'
import { Button } from '@everynews/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@everynews/components/ui/dialog'
import { Input } from '@everynews/components/ui/input'
import { toastNetworkError } from '@everynews/lib/error'
import Link from 'next/link'
import { useState } from 'react'

export const SignIn = () => {
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) return
    try {
      setIsLoading(true)
      await auth.signIn.magicLink({ email: contact })
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Welcome to Everynews</DialogTitle>
            <DialogDescription>
              By logging in, you agree to our{' '}
              <Link href='/terms' className='text-blue-500'>
                terms of service
              </Link>
              .
            </DialogDescription>
          </DialogHeader>
          <div className='py-6'>
            <Input
              id='email'
              type='email'
              placeholder='elon@twitter.com'
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
