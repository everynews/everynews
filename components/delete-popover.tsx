'use client'

import { Button } from '@everynews/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@everynews/components/ui/popover'
import { useState } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'

type DeletePopoverProps = {
  itemName: string
  onDelete: () => Promise<void>
  children: React.ReactNode
  successMessage?: string
}

export const DeletePopover = ({
  itemName,
  onDelete,
  children,
  successMessage,
}: DeletePopoverProps) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      await onDelete()
      toast.success(successMessage ?? `${itemName} deleted successfully`)
      setOpen(false)
    } catch (error) {
      toast.error(`Failed to delete ${itemName}`, {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className='flex flex-col gap-2'>
        <h2 className='text-lg font-semibold'>Delete "{itemName}"?</h2>
        <p className='text-muted-foreground'>This action cannot be undone.</p>
        <footer className='flex justify-end gap-2'>
          <Button variant='outline' size='sm' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <SubmitButton
            variant='destructive'
            size='sm'
            onClick={handleDelete}
            loading={loading}
          >
            Delete
          </SubmitButton>
        </footer>
      </PopoverContent>
    </Popover>
  )
}
