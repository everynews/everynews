'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@everynews/components/ui/popover'
import type { Channel } from '@everynews/schema/channel'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ScalingLoader } from './scaling-loader'

export const DeleteChannelPopover = ({ channel }: { channel: Channel }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handleDelete = async () => {
    try {
      setLoading(true)
      await api.channels[':id'].$delete({
        param: {
          id: channel.id,
        },
      })
      router.refresh()
      toast.success('Channel deleted successfully')
      setOpen(false)
    } catch (error) {
      toast.error('Failed to delete channel', {
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
        <h2 className='font-semibold text-lg'>Delete "{channel.name}"?</h2>
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
