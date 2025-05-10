'use client'

import { auth } from '@everynews/auth/client'
import { PhoneNumberInput } from '@everynews/components/auth/phone-number-input'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@everynews/components/ui/tabs'
import { useIsMobile } from '@everynews/hooks/use-mobile'
import { toastNetworkError } from '@everynews/lib/error'
import Link from 'next/link'
import { useState } from 'react'

export const SignIn = () => {
  const [contact, setContact] = useState('')
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useIsMobile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) return
    try {
      setIsLoading(true)
      if (method === 'email') {
        await auth.signIn.magicLink({ email: contact })
      } else {
        await auth.phoneNumber.sendOtp({ phoneNumber: contact })
      }
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
          <Tabs defaultValue={isMobile ? 'phone' : 'email'} className='py-6' value={method} onValueChange={(value) => setMethod(value as 'email' | 'phone')}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='email'>Email</TabsTrigger>
              <TabsTrigger value='phone'>Phone</TabsTrigger>
            </TabsList>
            <TabsContent value='email'>
              <Input
                id='email'
                type='email'
                placeholder='elon@twitter.com'
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </TabsContent>
            <TabsContent value='phone'>
              <PhoneNumberInput />
            </TabsContent>
          </Tabs>
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
