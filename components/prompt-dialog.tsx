'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@everynews/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@everynews/components/ui/form'
import { Input } from '@everynews/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@everynews/components/ui/select'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import { DEFAULT_PROMPT_PLACEHOLDER } from '@everynews/lib/prompts'
import {
  LANGUAGE_LABELS,
  type Prompt,
  type PromptDto,
  PromptDtoSchema,
  SUPPORTED_LANGUAGES,
} from '@everynews/schema/prompt'
import { zodResolver } from '@hookform/resolvers/zod'
import { humanId } from 'human-id'
import { PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'

export const PromptDialog = ({
  mode,
  original,
  trigger,
  onSuccess,
}: {
  mode: 'create' | 'edit'
  original?: Prompt
  trigger?: React.ReactNode
  onSuccess?: () => void
}) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const defaultPromptContent = DEFAULT_PROMPT_PLACEHOLDER

  const createValues: PromptDto = {
    content: defaultPromptContent,
    language: 'en',
    name: humanId({ capitalize: true, separator: ' ' }),
  }

  const form = useForm<PromptDto>({
    defaultValues:
      mode === 'create'
        ? createValues
        : {
            content: original?.content || defaultPromptContent,
            language: original?.language || 'en',
            name: original?.name || '',
          },
    resolver: zodResolver(PromptDtoSchema),
  })

  const onSubmit = async (values: PromptDto) => {
    setIsSubmitting(true)
    try {
      let res: Response
      if (mode === 'create') {
        res = await api.prompts.$post({ json: values })
      } else {
        if (!original?.id) {
          toast.error('Missing prompt ID for update')
          return
        }
        res = await api.prompts[':id'].$put({
          json: values,
          param: { id: original.id },
        })
      }

      if (!res.ok) {
        toast.error(`Failed to ${mode} prompt`)
        return
      }

      toast.success(
        mode === 'create'
          ? `Prompt "${form.watch('name')}" created.`
          : `Prompt "${form.watch('name')}" updated.`,
      )
      setOpen(false)
      if (mode === 'create') {
        form.reset({
          ...createValues,
          name: humanId({ capitalize: true, separator: ' ' }),
        })
      } else {
        form.reset()
      }
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button className='flex gap-1'>
      <PlusCircle className='size-4' />
      Create Prompt
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='md:min-w-4xl max-h-[90dvh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Prompt' : 'Edit Prompt'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex flex-col gap-6'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Name</FormLabel>
                  <FormControl>
                    <Input placeholder='My Custom Prompt' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='language'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select language' />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {LANGUAGE_LABELS[lang]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Instructions</FormLabel>
                  <p className='text-muted-foreground text-sm'>
                    The AI will use <code>&lt;TITLE&gt;</code> and{' '}
                    <code>&lt;KEYFINDING&gt;</code> tags for structured output.
                  </p>
                  <FormControl>
                    <Textarea
                      placeholder={DEFAULT_PROMPT_PLACEHOLDER}
                      className='min-h-[12rem]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton
                onClick={form.handleSubmit(onSubmit)}
                loading={isSubmitting}
              >
                {mode === 'create' ? 'Create' : 'Update'}
              </SubmitButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
