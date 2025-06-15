'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@everynews/components/ui/popover'
import type { Prompt } from '@everynews/schema/prompt'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'

export const DeletePromptPopover = ({
  prompt,
  trigger,
}: {
  prompt: Prompt
  trigger?: React.ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setLoading(true)
      await api.prompts[':id'].$delete({
        param: {
          id: prompt.id,
        },
      })
      router.push('/my/prompts')
      toast.success('Prompt deleted successfully')
    } catch (error) {
      toast.error('Failed to delete prompt', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button size='sm' variant='ghost' className='text-destructive'>
      Delete
    </Button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
      <PopoverContent className='flex flex-col gap-2'>
        <h2 className='font-semibold text-lg'>Delete "{prompt.name}"?</h2>
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
