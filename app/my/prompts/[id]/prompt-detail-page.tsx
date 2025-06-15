'use client'

import { api } from '@everynews/app/api'
import { DeletePromptPopover } from '@everynews/components/delete-prompt-popover'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import { Input } from '@everynews/components/ui/input'
import { Label } from '@everynews/components/ui/label'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import { DEFAULT_PROMPT_PLACEHOLDER } from '@everynews/lib/prompts'
import type { Prompt } from '@everynews/schema/prompt'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { toast } from 'sonner'

export const PromptDetailPage = ({ prompt }: { prompt: Prompt }) => {
  const router = useRouter()
  const [name, setName] = useState(prompt.name)
  const [content, setContent] = useState(prompt.content)
  const [isSaving, setIsSaving] = useState(false)

  const nameId = useId()
  const contentId = useId()

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a prompt name')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter prompt content')
      return
    }

    setIsSaving(true)

    try {
      const res = await api.prompts[':id'].$put({
        json: { content: content.trim(), name: name.trim() },
        param: { id: prompt.id },
      })

      if (!res.ok) {
        toast.error('Failed to save prompt')
        return
      }

      toast.success('Prompt saved successfully')
      router.refresh()
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='container mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>{name || 'Untitled Prompt'}</h1>
        <p className='text-muted-foreground mt-1'>
          Created {new Date(prompt.createdAt).toLocaleDateString()} • Updated{' '}
          {new Date(prompt.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className='space-y-6'>
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
            className='min-h-96 font-mono text-sm'
          />
        </div>
        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/my/prompts')}
          >
            Cancel
          </Button>
          <DeletePromptPopover prompt={prompt} />
          <SubmitButton onClick={handleSave} loading={isSaving}>
            Save
          </SubmitButton>
        </div>
      </div>
    </div>
  )
}
