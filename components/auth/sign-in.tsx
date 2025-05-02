'use client'

import { auth } from '@everynews/auth/client'
import { Button } from '@everynews/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@everynews/components/ui/dialog'
import { Input } from '@everynews/components/ui/input'
import { cn } from '@everynews/lib/utils'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@everynews/components/ui/tabs'
import { PhoneNumberInput } from './phone-number-input'

export const SignIn = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
        <Button variant='outline' size='sm' className='w-full'>
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Welcome!</DialogTitle>
          <DialogDescription>
            Select Email or Phone number.
          </DialogDescription>
        </DialogHeader>
        <div className={cn('flex flex-col gap-6', className)} {...props}>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleSubmit}>
                <div className='flex flex-col gap-6'>
                  <div className='grid gap-2'>
                    <Input
                      id='email'
                      type='email'
                      placeholder='elon@twitter.com'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
                <div className='mt-4 text-center text-sm'>
                  By logging in, you agree to our terms of service.
                </div>
              </form>
            </TabsContent>
            <TabsContent value="phone">
              <form onSubmit={handleSubmit}>
                <div className='flex flex-col gap-6'>
                  <div className='grid gap-2'>
                  <PhoneNumberInput/>
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Sending link...' : 'Send Magic Link'}
                  </Button>
                </div>
                <div className='mt-4 text-center text-sm'>
                  By logging in, you agree to our terms of service.
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
