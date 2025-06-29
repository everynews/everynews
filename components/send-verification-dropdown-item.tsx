'use client'

import { api } from '@everynews/app/api'
import { DropdownMenuItem } from '@everynews/components/ui/dropdown-menu'
import { toastNetworkError } from '@everynews/lib/error'
import type { Channel } from '@everynews/schema/channel'
import { SendHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export const SendVerificationDropdownItem = ({
  channel,
}: {
  channel: Channel
}) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendVerification = async () => {
    setLoading(true)
    try {
      const response = await api.channels[':id'].verify.$post({
        param: { id: channel.id },
      })

      if (!response.ok) {
        toast.error('Failed to send verification')
        return
      }

      toast.success('Verification sent successfully')
      router.refresh()
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenuItem onClick={handleSendVerification} disabled={loading}>
      <SendHorizontal className='mr-2 size-4' />
      Send Verification
    </DropdownMenuItem>
  )
}
