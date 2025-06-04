'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@everynews/components/ui/popover'
import type { Newsletter } from '@everynews/schema/newsletter'
import { useState } from 'react'
import { toast } from 'sonner'
import { ScalingLoader } from './scaling-loader'
export const DeleteNewsletterPopover = ({
  newsletter,
}: {
  newsletter: Newsletter
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleDelete = async () => {
    try {
      setLoading(true)
      await api.newsletters[':id'].$delete({
        param: {
          id: newsletter.id,
        },
      })
      toast.success('Newsletter deleted successfully')
      setOpen(false)
    } catch (error) {
      toast.error('Failed to delete newsletter', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          Delete
        </Button>
      </PopoverTrigger>
      <PopoverContent className='flex flex-col gap-2'>
        <h2 className='font-semibold text-lg'>Delete "{newsletter.name}"?</h2>
        <p className='text-muted-foreground'>This action cannot be undone.</p>

        <footer className='flex justify-end gap-2'>
          <Button variant='outline' size='sm' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            size='sm'
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
            <ScalingLoader loading={loading} />
          </Button>
        </footer>
      </PopoverContent>
    </Popover>
  )
}
