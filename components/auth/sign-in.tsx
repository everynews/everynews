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
import { Label } from '@everynews/components/ui/label'
import { cn } from '@everynews/lib/utils'
import { useState } from 'react'

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
          <DialogTitle className='sr-only'>Login</DialogTitle>
          <DialogDescription className='sr-only'>
            Login to your account
          </DialogDescription>
        </DialogHeader>

        <div className={cn('flex flex-col gap-6', className)} {...props}>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Sending link...' : 'Send Magic Link'}
              </Button>
            </div>
            <div className='mt-4 text-center text-sm'>
              By logging in, you agree to our terms of service.
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
