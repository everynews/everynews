'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
import { Checkbox } from '@everynews/components/ui/checkbox'
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
  RadioGroup,
  RadioGroupItem,
} from '@everynews/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@everynews/components/ui/select'
import { Separator } from '@everynews/components/ui/separator'
import { Switch } from '@everynews/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@everynews/components/ui/tabs'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import {
  type Newsletter,
  type NewsletterDto,
  NewsletterDtoSchema,
} from '@everynews/schema/newsletter'
import type { Prompt } from '@everynews/schema/prompt'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { PromptDialog } from './prompt-dialog'
import { SubmitButton } from './submit-button'

const STRATEGY_WITH_QUERY = ['exa']

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const
const HOURS_2_INTERVAL = Array.from({ length: 12 }, (_, i) => i * 2) // 0-22

export const NewsletterDialog = ({
  mode,
  original,
  trigger,
}: {
  mode: 'create' | 'edit'
  original?: Newsletter
  trigger?: React.ReactNode
}) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const id = useId()
  const switchActiveId = useId()
  const switchPublicId = useId()

  const [scheduleDays, setScheduleDays] = useState<string[]>([])
  const [scheduleHours, setScheduleHours] = useState<number[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await api.prompts.$get()
        if (res.ok) {
          const data = await res.json()
          setPrompts(data.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })))
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error)
      }
    }

    if (open) {
      fetchPrompts()
    }
  }, [open])

  const createValues: NewsletterDto = {
    active: true,
    description: '',
    isPublic: true,
    name: '',
    promptId: null,
    strategy: { provider: 'hnbest' },
    wait: { type: 'count', value: 10 },
  }

  const form = useForm<NewsletterDto>({
    defaultValues:
      mode === 'create'
        ? createValues
        : {
            active: original?.active ?? true,
            description: original?.description || '',
            isPublic: original?.isPublic ?? true,
            name: original?.name || '',
            promptId: original?.promptId || null,
            strategy: original?.strategy || { provider: 'hnbest' },
            wait: original?.wait || { type: 'count', value: 10 },
          },
    resolver: zodResolver(NewsletterDtoSchema),
  })

  const onSubmit = async (values: NewsletterDto) => {
    setIsSubmitting(true)
    try {
      const apiData: NewsletterDto = {
        active: values.active,
        description: values.description,
        isPublic: values.isPublic,
        name: values.name,
        promptId: values.promptId,
        strategy:
          values.strategy.provider === 'exa'
            ? { provider: 'exa', query: values.strategy.query || '' }
            : { provider: 'hnbest' },
        wait: values.wait,
      }
      let res: Response
      if (mode === 'create') {
        res = await api.newsletters.$post({ json: apiData })
      } else {
        if (!original?.id) {
          toast.error('Missing newsletter ID for update')
          return
        }
        res = await api.newsletters[':id'].$put({
          json: apiData,
          param: { id: original.id },
        })
      }

      if (!res.ok) {
        toast.error(`Failed to ${mode} newsletter`)
        return
      }
      toast.success(
        mode === 'create'
          ? `Newsletter "${form.watch('name')}" created.`
          : `Newsletter "${form.watch('name')}" updated.`,
      )
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const strategyProvider = form.watch('strategy.provider')
  const waitType = form.watch('wait.type')

  const defaultTrigger = (
    <Button className='flex gap-1'>
      <PlusCircle className='size-4' />
      Create Newsletter
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='md:min-w-6xl max-h-[90dvh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Newsletter' : 'Edit Newsletter'}
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
                <FormItem className='md:flex md:items-center md:justify-between'>
                  <div className='md:w-1/3'>
                    <FormLabel className='text-md'>
                      How should we call this newsletter?
                    </FormLabel>
                  </div>
                  <div className='md:w-2/3'>
                    <FormControl>
                      <Input placeholder='Daily Tech News' {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='md:flex md:items-start md:justify-between'>
                  <div className='md:w-1/3'>
                    <FormLabel className='text-md'>
                      Description (optional)
                    </FormLabel>
                  </div>
                  <div className='md:w-2/3'>
                    <FormControl>
                      <Textarea
                        placeholder='A brief description of what this newsletter covers...'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='promptId'
              render={({ field }) => (
                <FormItem className='md:flex md:items-start md:justify-between'>
                  <div className='md:w-1/3'>
                    <FormLabel className='text-md'>
                      AI Prompt (optional)
                    </FormLabel>
                    <p className='text-muted-foreground text-sm mt-1'>
                      Choose a custom prompt for AI summarization. Uses default
                      prompt if none selected.
                    </p>
                  </div>
                  <div className='md:w-2/3'>
                    <div className='flex gap-2'>
                      <FormControl>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select a prompt (optional)' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=''>Default Prompt</SelectItem>
                            {prompts.map((prompt) => (
                              <SelectItem key={prompt.id} value={prompt.id}>
                                {prompt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <PromptDialog
                        mode='create'
                        onSuccess={() => {
                          // Refetch prompts when a new one is created
                          api.prompts.$get().then((res) => {
                            if (res.ok) {
                              res.json().then(data => setPrompts(data.map((p: any) => ({
                                ...p,
                                createdAt: new Date(p.createdAt),
                                updatedAt: new Date(p.updatedAt),
                              }))))
                            }
                          })
                        }}
                      />
                    </div>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name='strategy.provider'
              render={({ field }) => (
                <FormItem className='md:flex md:items-start md:justify-between'>
                  <div className='md:w-1/3'>
                    <FormLabel className='text-md'>
                      Where should we collect news from?
                    </FormLabel>
                  </div>
                  <div className='md:w-2/3'>
                    <FormControl>
                      <RadioGroup
                        className='gap-2 xl:grid xl:grid-cols-2'
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <label
                          htmlFor={`${id}-hnbest`}
                          className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'
                        >
                          <RadioGroupItem
                            value='hnbest'
                            id={`${id}-hnbest`}
                            aria-describedby={`${id}-hnbest-description`}
                            className='order-1 after:absolute after:inset-0 cursor-pointer'
                          />
                          <div className='flex grow items-center gap-3'>
                            <div className='grid grow gap-2'>
                              <span>Popular Tech</span>
                              <p
                                id={`${id}-hnbest-description`}
                                className='text-muted-foreground text-sm'
                              >
                                Automatically collect popular tech news online.
                                Everynews uses Hacker News Best Stories as the
                                source.
                              </p>
                            </div>
                          </div>
                        </label>

                        <label
                          htmlFor={`${id}-exa`}
                          className=' border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'
                        >
                          <RadioGroupItem
                            value='exa'
                            id={`${id}-exa`}
                            aria-describedby={`${id}-exa-description`}
                            className='order-1 after:absolute after:inset-0 cursor-pointer'
                          />
                          <div className='flex grow items-start gap-3'>
                            <div className='grid grow gap-2'>
                              <span>Online Search</span>
                              <p
                                id={`${id}-exa-description`}
                                className='text-muted-foreground text-sm'
                              >
                                Search on a specific query. Everynews uses Exa
                                AI to search the web.
                              </p>
                            </div>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {STRATEGY_WITH_QUERY.includes(strategyProvider) && (
              <>
                <Separator />
                <FormField
                  control={form.control}
                  name='strategy.query'
                  render={({ field }) => (
                    <FormItem className='md:flex md:items-start md:justify-between'>
                      <div className='md:w-1/3'>
                        <FormLabel className='text-md'>
                          What query should we monitor?
                        </FormLabel>
                      </div>
                      <div className='md:w-2/3'>
                        <FormControl>
                          <Textarea
                            placeholder='artificial intelligence'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <Separator />

            <FormField
              control={form.control}
              name='wait.type'
              render={({ field }) => (
                <FormItem className='md:flex md:items-start md:justify-between'>
                  <div className='md:w-1/3'>
                    <FormLabel className='text-md'>
                      How often should we send you updates?
                    </FormLabel>
                  </div>
                  <div className='md:w-2/3'>
                    <FormControl>
                      <RadioGroup
                        className='gap-2 lg:grid lg:grid-cols-2'
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <label
                          htmlFor={`${id}-count`}
                          className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
                        >
                          <div className='grid grow gap-2'>
                            <span>Based on Count</span>
                            <p className='text-muted-foreground text-sm'>
                              Send me updates only when there are enough news
                              collected
                            </p>
                          </div>
                          <RadioGroupItem
                            value='count'
                            id={`${id}-count`}
                            className='order-1 cursor-pointer'
                          />
                        </label>
                        <label
                          htmlFor={`${id}-schedule`}
                          className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
                        >
                          <div className='grid grow gap-2'>
                            <span>Based on Schedule</span>
                            <p className='text-muted-foreground text-sm'>
                              Send me updates based on periodic schedule
                            </p>
                          </div>
                          <RadioGroupItem
                            value='schedule'
                            id={`${id}-schedule`}
                            className='order-1 cursor-pointer'
                          />
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {waitType === 'count' && (
              <>
                <Separator />
                <FormField
                  control={form.control}
                  name='wait.value'
                  render={({ field }) => (
                    <FormItem className='md:flex md:items-start md:justify-between'>
                      <div className='md:w-1/3'>
                        <FormLabel className='text-md'>
                          How often do you want to receive updates?
                        </FormLabel>
                      </div>
                      <div className='md:w-2/3'>
                        <FormControl>
                          <Tabs
                            defaultValue={String(field.value)}
                            className='w-full'
                          >
                            <TabsList className='flex w-full'>
                              {[1, 10, 20].map((count) => (
                                <TabsTrigger
                                  key={count}
                                  value={count.toString()}
                                  onClick={() => field.onChange(count)}
                                  className='flex-1'
                                >
                                  {count === 1
                                    ? 'Immediately'
                                    : `Every ${count} articles`}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </Tabs>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            {waitType === 'schedule' && (
              <>
                <Separator />
                <FormField
                  control={form.control}
                  name='wait.value'
                  render={({ field }) => (
                    <FormItem className='md:flex md:items-start md:justify-between'>
                      <div className='md:w-1/3'>
                        <FormLabel className='text-md'>
                          On what schedule should we send you updates?
                        </FormLabel>
                      </div>
                      <div className='md:w-2/3'>
                        <div className='grid grid-cols-2 gap-8'>
                          <div className='flex flex-col gap-2'>
                            {DAYS_OF_WEEK.map((day) => (
                              <div
                                key={day}
                                className='flex items-center gap-2'
                              >
                                <Checkbox
                                  id={`${id}-day-${day}`}
                                  checked={scheduleDays.includes(day)}
                                  onCheckedChange={(checked) => {
                                    const next = checked
                                      ? [...scheduleDays, day]
                                      : scheduleDays.filter((d) => d !== day)
                                    setScheduleDays(next)
                                    field.onChange(
                                      JSON.stringify({
                                        days: next,
                                        hours: scheduleHours,
                                      }),
                                    )
                                  }}
                                />
                                <label htmlFor={`${id}-day-${day}`}>
                                  {day}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div className='flex flex-col gap-2'>
                            <div className='grid grid-cols-2 gap-2'>
                              {HOURS_2_INTERVAL.map((h) => (
                                <div
                                  key={h}
                                  className='flex items-center gap-2'
                                >
                                  <Checkbox
                                    id={`${id}-hour-${h}`}
                                    checked={scheduleHours.includes(h)}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...scheduleHours, h]
                                        : scheduleHours.filter((hr) => hr !== h)
                                      setScheduleHours(next)
                                      field.onChange(
                                        JSON.stringify({
                                          days: scheduleDays,
                                          hours: next,
                                        }),
                                      )
                                    }}
                                  />
                                  <label
                                    htmlFor={`${id}-hour-${h}`}
                                  >{`${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`}</label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <Separator />
            <FormItem className='grid lg:grid-cols-3 lg:gap-4'>
              <div className='lg:w-1/3'>
                <FormLabel className='text-md'>
                  Are there anything else you want to configure?{' '}
                </FormLabel>
              </div>

              <FormControl>
                <div className='grid lg:grid-cols-2 gap-4 lg:col-span-2'>
                  <FormField
                    control={form.control}
                    name='active'
                    render={({ field }) => (
                      <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
                        <Switch
                          id={switchActiveId}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2'
                          aria-describedby={`${switchActiveId}-description`}
                        />
                        <div className='grid grow gap-2'>
                          <label htmlFor={switchActiveId}>Active</label>
                          <p
                            id={`${switchActiveId}-description`}
                            className='text-muted-foreground text-sm'
                          >
                            We will only gather & send news when the news is
                            marked active.
                          </p>
                        </div>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='isPublic'
                    render={({ field }) => (
                      <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
                        <Switch
                          id={switchPublicId}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2'
                          aria-describedby={`${switchPublicId}-description`}
                        />
                        <div className='grid grow gap-2'>
                          <label htmlFor={switchPublicId}>Public</label>
                          <p
                            id={`${switchPublicId}-description`}
                            className='text-muted-foreground text-sm'
                          >
                            Should others be able to subscribe to this news?
                          </p>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </FormControl>
            </FormItem>

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
