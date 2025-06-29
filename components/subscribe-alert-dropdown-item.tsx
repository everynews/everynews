'use client'

import { api } from '@everynews/app/api'
import { DropdownMenuItem } from '@everynews/components/ui/dropdown-menu'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import type { Channel } from '@everynews/schema/channel'
import type { Subscription } from '@everynews/schema/subscription'
import { Bell, BellOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SubscribeAlertDialog } from './subscribe-alert-dialog'

export const SubscribeAlertDropdownItem = ({
  alert,
  channels,
  subscription,
  user,
}: {
  alert: Alert
  channels: Channel[]
  subscription?: Subscription
  user?: { id: string; email: string; createdAt: Date }
}) => {
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()

  const handleUnsubscribe = async () => {
    if (!subscription) return

    setLoading(true)
    try {
      const response = await api.subscriptions[':id'].$delete({
        param: { id: subscription.id },
      })

      if (!response.ok) {
        toast.error('Failed to unsubscribe from alert')
        return
      }

      toast.success(`Successfully unsubscribed from "${alert.name}"`)
      router.refresh()
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setLoading(false)
    }
  }

  if (subscription) {
    return (
      <DropdownMenuItem onClick={handleUnsubscribe} disabled={loading}>
        <BellOff className='mr-2 size-4' />
        Unsubscribe
      </DropdownMenuItem>
    )
  }

  return (
    <>
      <DropdownMenuItem onClick={() => setShowDialog(true)}>
        <Bell className='mr-2 size-4' />
        Subscribe
      </DropdownMenuItem>
      <SubscribeAlertDialog
        alert={alert}
        channels={channels}
        open={showDialog}
        onOpenChange={setShowDialog}
        user={user}
      />
    </>
  )
}
