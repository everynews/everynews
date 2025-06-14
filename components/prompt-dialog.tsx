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
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import {
  type Prompt,
  type PromptDto,
  PromptDtoSchema,
} from '@everynews/schema/prompt'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SubmitButton } from './submit-button'

const defaultPromptContent = `1. A contextual title that captures the essence of the article (not just the original title)
2. Key discoveries, insights, or developments from the article
3. Do not simply introduce the article; include actual substantive findings directly
4. Within Key Findings or Title, write plain text only. Do not include markdown formatting.
5. When creating the title, focus on who (if any) did what and why it was impactful.
6. Use simple language. Keep things real; honest, and don't force friendliness. Avoid unnecessary adjectives and adverbs. Focus on clarity.
7. Most importantly. Think why the original title was given that way. It may include why it was impactful or interesting.`

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

  const createValues: PromptDto = {
    content: defaultPromptContent,
    name: '',
  }

  const form = useForm<PromptDto>({
    defaultValues:
      mode === 'create'
        ? createValues
        : {
            content: original?.content || defaultPromptContent,
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
      form.reset()
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
                      placeholder={defaultPromptContent}
                      className='min-h-48'
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
