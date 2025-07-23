'use client'

import { auth } from '@everynews/auth/client'
import { SubmitButton } from '@everynews/components/submit-button'
import { toastNetworkError } from '@everynews/lib/error'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface ResendVerificationButtonProps {
  email: string
}

export const ResendVerificationButton = ({
  email,
}: ResendVerificationButtonProps) => {
  const [isResending, setIsResending] = useState(false)

  const resendVerificationEmail = useCallback(async () => {
    try {
      setIsResending(true)
      await auth.sendVerificationEmail({
        email,
      })
      toast.success('Verification email sent! Please check your inbox.')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsResending(false)
    }
  }, [email])

  return (
    <SubmitButton
      onClick={resendVerificationEmail}
      loading={isResending}
      className='w-full'
    >
      Resend verification email
    </SubmitButton>
  )
}
