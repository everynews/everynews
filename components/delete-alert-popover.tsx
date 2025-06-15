'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@everynews/components/ui/popover'
import type { Alert } from '@everynews/schema/alert'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'

export const DeleteAlertPopover = ({
  alert,
  trigger,
}: {
  alert: Alert
  trigger?: React.ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handleDelete = async () => {
    try {
      setLoading(true)
      await api.alerts[':id'].$delete({
        param: {
          id: alert.id,
        },
      })
      router.refresh()
      toast.success('Alert deleted successfully')
      setOpen(false)
    } catch (error) {
      toast.error('Failed to delete alert', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }
  const defaultTrigger = (
    <Button variant='outline' size='sm'>
      Delete
    </Button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
      <PopoverContent className='flex flex-col gap-2'>
        <h2 className='font-semibold text-lg'>Delete "{alert.name}"?</h2>
        <p className='text-muted-foreground'>This action cannot be undone.</p>

        <footer className='flex justify-end gap-2'>
          <Button variant='outline' size='sm' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <SubmitButton
            variant='destructive'
            size='sm'
            onClick={handleDelete}
            disabled={loading}
            loading={loading}
          >
            Delete
          </SubmitButton>
        </footer>
      </PopoverContent>
    </Popover>
  )
}
