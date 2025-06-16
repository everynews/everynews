'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { toastNetworkError } from '@everynews/lib/error'
import type { Alert } from '@everynews/schema/alert'
import type { Channel } from '@everynews/schema/channel'
import type { Subscription } from '@everynews/schema/subscription'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'
import { SubscribeAlertDialog } from './subscribe-alert-dialog'

export const SubscribeAlertButton = ({
  alert,
  channels,
  subscription,
  user,
  className,
}: {
  alert: Alert
  channels: Channel[]
  subscription?: Subscription
  user?: { id: string; email: string; createdAt: Date }
  className?: string
}) => {
  const [loading, setLoading] = useState(false)
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
      <SubmitButton
        variant='ghost'
        size='sm'
        onClick={handleUnsubscribe}
        loading={loading}
        className={className}
      >
        Unsubscribe
      </SubmitButton>
    )
  }

  return (
    <SubscribeAlertDialog alert={alert} channels={channels} user={user}>
      <Button variant='ghost' size='sm' className={className}>
        Subscribe
      </Button>
    </SubscribeAlertDialog>
  )
}
