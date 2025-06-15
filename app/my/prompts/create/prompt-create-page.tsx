'use client'

import { api } from '@everynews/app/api'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import { Input } from '@everynews/components/ui/input'
import { Label } from '@everynews/components/ui/label'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import { DEFAULT_PROMPT_PLACEHOLDER } from '@everynews/lib/prompts'
import { getDefaultPromptContent } from '@everynews/lib/prompts/default-prompt'
import { humanId } from 'human-id'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { toast } from 'sonner'

export const PromptCreatePage = () => {
  const router = useRouter()
  const [name, setName] = useState(
    humanId({ capitalize: false, separator: '-' }),
  )
  const [content, setContent] = useState(getDefaultPromptContent())
  const [isCreating, setIsCreating] = useState(false)

  const nameId = useId()
  const contentId = useId()

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a prompt name')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter prompt content')
      return
    }

    setIsCreating(true)

    try {
      const res = await api.prompts.$post({
        json: { content: content.trim(), name: name.trim() },
      })

      if (!res.ok) {
        toast.error('Failed to create prompt')
        return
      }

      const prompt = await res.json()
      toast.success('Prompt created successfully')
      router.push(`/my/prompts/${prompt.id}`)
    } catch (error) {
      toastNetworkError(error as Error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className='container mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Create Prompt</h1>
        <p className='text-muted-foreground mt-1'>
          Create a custom AI prompt for alert summarization
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
          <SubmitButton onClick={handleCreate} loading={isCreating}>
            Create
          </SubmitButton>
        </div>
      </div>
    </div>
  )
}
