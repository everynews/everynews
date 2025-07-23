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
import { toastNetworkError } from '@everynews/lib/error'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!token) {
        toast.error('Invalid reset link')
        return
      }

      if (!password || !confirmPassword) {
        toast.error('Please fill in all fields')
        return
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long')
        return
      }

      try {
        setIsLoading(true)
        await auth.resetPassword({
          newPassword: password,
          token,
        })
        setIsPasswordReset(true)
        setTimeout(() => {
          router.push('/sign-in')
        }, 3000)
      } catch (e) {
        toastNetworkError(e as Error)
      } finally {
        setIsLoading(false)
      }
    },
    [password, confirmPassword, token, router],
  )

  if (!token) {
    return (
      <div className='flex items-center justify-center bg-background p-4 my-10'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardFooter className='flex justify-center'>
            <Link
              href='/forgot-password'
              className='text-sm text-orange-500 hover:underline'
            >
              Request a new reset link
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (isPasswordReset) {
    return (
      <div className='flex items-center justify-center bg-background p-4 my-10'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
              <CheckCircle2 className='size-6 text-green-600 dark:text-green-400' />
            </div>
            <CardTitle>Password reset successful!</CardTitle>
            <CardDescription>
              Your password has been updated. Redirecting to sign in...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center bg-background p-4 my-10'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className='text-xs text-muted-foreground'>
                Must be at least 8 characters long
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <SubmitButton type='submit' loading={isLoading} className='w-full'>
              Reset password
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <Link
            href='/sign-in'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
