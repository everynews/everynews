'use client'

import { api } from '@everynews/app/api'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@everynews/components/ui/dialog'
import { Input } from '@everynews/components/ui/input'
import { Label } from '@everynews/components/ui/label'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import { DEFAULT_PROMPT_PLACEHOLDER } from '@everynews/lib/prompts'
import { getDefaultPromptContent } from '@everynews/lib/prompts/default-prompt'
import type { Prompt } from '@everynews/schema/prompt'
import { humanId } from 'human-id'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

type PromptDialogProps = {
  mode: 'create' | 'edit'
  prompt?: Prompt
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (prompt: Prompt) => void
}

export const PromptDialog = ({
  mode,
  prompt,
  open,
  onOpenChange,
  onSuccess,
}: PromptDialogProps) => {
  const router = useRouter()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nameId = useId()
  const contentId = useId()

  useEffect(() => {
    if (mode === 'create') {
      setName(humanId({ capitalize: false, separator: '-' }))
      setContent(getDefaultPromptContent())
    } else if (mode === 'edit' && prompt) {
      setName(prompt.name)
      setContent(prompt.content)
    }
  }, [mode, prompt])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a prompt name')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter prompt content')
      return
    }

    setIsSubmitting(true)

    try {
      let res: Response
      if (mode === 'create') {
        res = await api.prompts.$post({
          json: { content: content.trim(), name: name.trim() },
        })
      } else if (prompt) {
        res = await api.prompts[':id'].$put({
          json: { content: content.trim(), name: name.trim() },
          param: { id: prompt.id },
        })
      } else {
        toast.error('No prompt selected for editing')
        return
      }

      if (!res.ok) {
        toast.error(`Failed to ${mode} prompt`)
        return
      }

      const updatedPrompt = await res.json()
      toast.success(
        `Prompt ${mode === 'create' ? 'created' : 'updated'} successfully`,
      )

      if (onSuccess) {
        onSuccess(updatedPrompt)
      }

      router.refresh()
      onOpenChange(false)
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Prompt' : 'Edit Prompt'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a custom AI prompt for alert summarization'
              : 'Update your AI prompt for alert summarization'}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter prompt name'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={contentId}>Instructions</Label>
            <Textarea
              id={contentId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={DEFAULT_PROMPT_PLACEHOLDER}
              className='min-h-64 font-mono text-sm'
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <SubmitButton onClick={handleSubmit} loading={isSubmitting}>
            {mode === 'create' ? 'Create' : 'Save'}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
