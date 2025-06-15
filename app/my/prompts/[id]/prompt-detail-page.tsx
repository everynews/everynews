'use client'

import { api } from '@everynews/app/api'
import { DeletePromptPopover } from '@everynews/components/delete-prompt-popover'
import { SubmitButton } from '@everynews/components/submit-button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
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
    <>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>{name || 'Untitled Prompt'}</h1>
          <p className='text-muted-foreground text-sm mt-1'>
            Created {new Date(prompt.createdAt).toLocaleDateString()} • Updated{' '}
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <DeletePromptPopover prompt={prompt} />
          <SubmitButton onClick={handleSave} loading={isSaving}>
            Save
          </SubmitButton>
        </div>
      </div>

      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>Prompt Configuration</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-1'>
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter prompt name'
            />
          </div>
          <div className='grid gap-1'>
            <Label htmlFor={contentId}>Instructions</Label>
            <Textarea
              id={contentId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={DEFAULT_PROMPT_PLACEHOLDER}
              className='min-h-96 font-mono text-sm'
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
