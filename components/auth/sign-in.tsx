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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@everynews/components/ui/tabs'
import { useIsMobile } from '@everynews/hooks/use-mobile'
import Link from 'next/link'
import { useState } from 'react'
import { PhoneNumberInput } from './phone-number-input'

export const SignIn = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useIsMobile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setIsLoading(true)
      await auth.signIn.magicLink({ email })
    } catch (error) {
      console.error('Login error:', error)
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
          <Tabs defaultValue={isMobile ? 'phone' : 'email'} className='py-6'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='email'>Email</TabsTrigger>
              <TabsTrigger value='phone'>Phone</TabsTrigger>
            </TabsList>
            <TabsContent value='email'>
              <Input
                id='email'
                type='email'
                placeholder='elon@twitter.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
