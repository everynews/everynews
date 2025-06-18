'use client'

import { api } from '@everynews/app/api'
import { DeletePopover } from '@everynews/components/delete-popover'
import type { Prompt } from '@everynews/schema/prompt'
import { useRouter } from 'next/navigation'

export const DeletePromptPopover = ({
  prompt,
  children,
}: {
  prompt: Prompt
  children?: React.ReactNode
}) => {
  const router = useRouter()

  const handleDelete = async () => {
    await api.prompts[':id'].$delete({
      param: { id: prompt.id },
    })
    router.push('/my/prompts')
  }

  return (
    <DeletePopover
      itemName={prompt.name}
      onDelete={handleDelete}
      successMessage='Prompt deleted successfully'
    >
      {children}
    </DeletePopover>
  )
}
