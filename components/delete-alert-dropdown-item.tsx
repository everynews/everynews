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
import type { Alert } from '@everynews/schema/alert'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export const DeleteAlertDropdownItem = ({ alert }: { alert: Alert }) => {
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await api.alerts[':id'].$delete({
        param: { id: alert.id },
      })

      if (!response.ok) {
        toast.error('Failed to delete alert')
        return
      }

      toast.success(`"${alert.name}" has been deleted`)
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
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{alert.name}"? This action cannot
              be undone.
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
