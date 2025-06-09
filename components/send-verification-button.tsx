'use client'

import { api } from '@everynews/app/api'
import type { Channel } from '@everynews/schema/channel'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'

export const SendVerificationButton = ({ channel }: { channel: Channel }) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendVerification = async () => {
    setLoading(true)
    try {
      const res = await api.channels[':id']['send-verification'].$post({
        param: { id: channel.id },
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(
          'error' in error ? error.error : 'Failed to send verification email',
        )
        return
      }

      toast.success('Verification email sent! Please check your inbox.')
      router.refresh()
    } catch (error) {
      toast.error('Failed to send verification email', {
        description: JSON.stringify(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SubmitButton
      onClick={handleSendVerification}
      loading={loading}
      variant='outline'
      size='sm'
    >
      Send Verification
    </SubmitButton>
  )
}
