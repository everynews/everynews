'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { toastNetworkError } from '@everynews/lib/error'
import type { Channel } from '@everynews/schema/channel'
import type { Newsletter } from '@everynews/schema/newsletter'
import type { Subscription } from '@everynews/schema/subscription'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'
import { SubscribeNewsletterDialog } from './subscribe-newsletter-dialog'

export const SubscribeNewsletterButton = ({
  newsletter,
  channels,
  subscription,
}: {
  newsletter: Newsletter
  channels: Channel[]
  subscription?: Subscription
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
        toast.error('Failed to unsubscribe from newsletter')
        return
      }

      toast.success(`Successfully unsubscribed from "${newsletter.name}"`)
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
        variant='outline'
        size='sm'
        onClick={handleUnsubscribe}
        loading={loading}
      >
        Unsubscribe
      </SubmitButton>
    )
  }

  return (
    <SubscribeNewsletterDialog newsletter={newsletter} channels={channels}>
      <Button variant='outline' size='sm'>
        Subscribe
      </Button>
    </SubscribeNewsletterDialog>
  )
}
