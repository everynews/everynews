'use client'

import { api } from '@everynews/app/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@everynews/components/ui/alert-dialog'
import { DropdownMenuItem } from '@everynews/components/ui/dropdown-menu'
import { toastNetworkError } from '@everynews/lib/error'
import type { Channel } from '@everynews/schema/channel'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const DeleteChannelDropdownItem = ({
  channel,
}: {
  channel: Channel
}) => {
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [subscriptionCount, setSubscriptionCount] = useState<number | null>(
    null,
  )
  const [fetchingCount, setFetchingCount] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchSubscriptionCount = async () => {
      if (!showDialog) return

      setFetchingCount(true)
      try {
        const response = await api.channels[':id']['subscription-count'].$get({
          param: { id: channel.id },
        })

        if (response.ok) {
          const data = await response.json()
          setSubscriptionCount(data.count)
        }
      } catch (error) {
        console.error('Failed to fetch subscription count:', error)
      } finally {
        setFetchingCount(false)
      }
    }

    fetchSubscriptionCount()
  }, [showDialog, channel.id])

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await api.channels[':id'].$delete({
        param: { id: channel.id },
      })

      if (!response.ok) {
        toast.error('Failed to delete channel')
        return
      }

      toast.success(`"${channel.name}" has been deleted`)
      router.refresh()
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setLoading(false)
      setShowDialog(false)
    }
  }

  return (
    <>
      <DropdownMenuItem
        className='text-destructive'
        onSelect={(e) => {
          e.preventDefault()
          setShowDialog(true)
        }}
      >
        <Trash2 className='mr-2 size-4 text-destructive' />
        Delete
      </DropdownMenuItem>
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription className='space-y-2'>
              Are you sure you want to delete{' '}
              <span className='font-medium'>"{channel.name}"?</span>
              {fetchingCount && (
                <p className='text-muted-foreground'>
                  Checking subscriptions...
                </p>
              )}
              {subscriptionCount !== null && subscriptionCount > 0 && (
                <p className='font-medium text-destructive'>
                  Warning: This will delete {subscriptionCount} subscription
                  {subscriptionCount > 1 ? 's' : ''} linked to this channel.
                </p>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
