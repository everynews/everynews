import { Button } from '@everynews/components/ui/button'
import { Combobox } from '@everynews/components/ui/combobox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import type { AlertDto } from '@everynews/schema/alert'
import type { Prompt } from '@everynews/schema/prompt'
import type { UseFormReturn } from 'react-hook-form'

interface PromptSelectorProps {
  form: UseFormReturn<AlertDto>
  prompts: Prompt[]
  onEditClick: (prompt: Prompt | undefined) => void
}

export const PromptSelector = ({
  form,
  prompts,
  onEditClick,
}: PromptSelectorProps) => {
  const selectedPromptId = form.watch('promptId')
  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId)

  const comboboxOptions = [
    { label: 'None', value: 'none' },
    ...prompts.map((prompt) => ({
      label: prompt.name,
      value: prompt.id,
    })),
  ]

  return (
    <FormField
      control={form.control}
      name='promptId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Summary Prompt (Optional)</FormLabel>
          <div className='flex gap-2'>
            <FormControl>
              <Combobox
                options={comboboxOptions}
                value={field.value || 'none'}
                onValueChange={(value) =>
                  field.onChange(value === 'none' ? null : value)
                }
                placeholder='Select a prompt'
                searchPlaceholder='Search prompts...'
                emptyText='No prompt found.'
                className='flex-1'
              />
            </FormControl>
            <Button
              type='button'
              variant='outline'
              onClick={() => onEditClick(selectedPrompt)}
            >
              {selectedPrompt ? 'Edit' : 'Create'}
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
