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
import { toast } from 'sonner'

export const SignIn = () => {
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

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
            onClick: () => window.open('https://mail.google.com', '_blank')
          },
        }),
      })
      setIsOpen(false)
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>Sign In</Button>
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
              type='email'
              placeholder='elon@x.com'
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
