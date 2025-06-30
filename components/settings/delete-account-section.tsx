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
  AlertDialogTrigger,
} from '@everynews/components/ui/alert-dialog'
import { Button } from '@everynews/components/ui/button'
import { Input } from '@everynews/components/ui/input'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export const DeleteAccountSection = () => {
  const _router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return

    setIsDeleting(true)
    try {
      const response = await api.users.me.$delete()

      if (response.ok) {
        toast.success('Account deleted', {
          description: 'Your account has been permanently deleted.',
        })

        // Redirect to home page after successful deletion
        window.location.href = '/'
      } else {
        throw new Error('Failed to delete account')
      }
    } catch (_error) {
      toast.error('Error', {
        description: 'Failed to delete account. Please try again.',
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className='space-y-4'>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button variant='destructive'>Delete Account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data including:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className='list-disc list-inside space-y-1 mt-2 text-sm text-muted-foreground'>
            <li>All your alerts and subscriptions</li>
            <li>All your channels (email, phone, Slack)</li>
            <li>All your prompts and settings</li>
            <li>Your entire account history</li>
          </ul>
          <div className='mt-4'>
            <p className='mb-2'>
              Type <span className='font-mono font-bold'>DELETE</span> to
              confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='DELETE'
              className='mt-2'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || isDeleting}
              className='bg-destructive hover:bg-destructive/50'
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
