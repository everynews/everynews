'use client'

import { api } from '@everynews/app/api'
import { AlertPreview } from '@everynews/components/alert-preview'
import { PromptDialog } from '@everynews/components/prompt-dialog'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import { Card } from '@everynews/components/ui/card'
import { Checkbox } from '@everynews/components/ui/checkbox'
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
import { Slider } from '@everynews/components/ui/slider'
import { Switch } from '@everynews/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@everynews/components/ui/tabs'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import { type AlertDto, AlertDtoSchema } from '@everynews/schema/alert'
import { getLanguageOptions } from '@everynews/schema/language'
import type { Prompt } from '@everynews/schema/prompt'
import { type Story, StorySchema } from '@everynews/schema/story'
import { zodResolver } from '@hookform/resolvers/zod'
import { humanId } from 'human-id'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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

export const AlertCreatePage = ({ prompts }: { prompts: Prompt[] }) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<Story[] | null>(null)
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [promptDialogMode, setPromptDialogMode] = useState<'create' | 'edit'>(
    'create',
  )
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | undefined>()
  const [localPrompts, setLocalPrompts] = useState<Prompt[]>(prompts)
  const id = useId()
  const switchActiveId = useId()
  const switchPublicId = useId()

  const [scheduleDays, setScheduleDays] = useState<string[]>([])
  const [scheduleHours, setScheduleHours] = useState<number[]>([])

  const form = useForm<AlertDto>({
    defaultValues: {
      active: true,
      description: '',
      isPublic: true,
      language: 'en',
      name: humanId({ capitalize: false, separator: '-' }),
      promptId: null,
      strategy: { provider: 'hnbest' },
      threshold: 70,
      wait: { type: 'count', value: 10 },
    },
    resolver: zodResolver(AlertDtoSchema),
  })

  const onSubmit = async (values: AlertDto) => {
    setIsSubmitting(true)
    try {
      const res = await api.alerts.$post({ json: values })

      if (!res.ok) {
        toast.error('Failed to create alert')
        return
      }

      toast.success(`Alert "${form.watch('name')}" created.`)
      router.push('/my/alerts')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onTest = async () => {
    const values = form.getValues()
    setIsTesting(true)
    setTestResults(null)

    try {
      const res = await api.drill.$post({ json: values })

      if (!res.ok) {
        toast.error('Failed to test alert')
        return
      }

      const storiesData = await res.json()
      const stories = storiesData.map((story: unknown) =>
        StorySchema.parse(story),
      )
      setTestResults(stories)
      toast.success(`Test completed. Found ${stories.length} stories.`)
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsTesting(false)
    }
  }

  const strategyProvider = form.watch('strategy.provider')
  const waitType = form.watch('wait.type')
  const selectedPromptId = form.watch('promptId')

  const handlePromptCreated = (newPrompt: Prompt) => {
    setLocalPrompts([...localPrompts, newPrompt])
    form.setValue('promptId', newPrompt.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const handlePromptUpdated = (updatedPrompt: Prompt) => {
    setLocalPrompts(
      localPrompts.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p)),
    )
  }

  const handlePromptButtonClick = () => {
    if (selectedPromptId === null) {
      setPromptDialogMode('create')
      setSelectedPrompt(undefined)
    } else {
      setPromptDialogMode('edit')
      setSelectedPrompt(localPrompts.find((p) => p.id === selectedPromptId))
    }
    setPromptDialogOpen(true)
  }

  return (
    <div className='container mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Create Alert</h1>
        <p className='text-muted-foreground mt-1'>
          Configure a new AI-powered alert for content monitoring
        </p>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div>
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
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Daily Tech News' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='A brief description of what this alert covers...'
                        {...field}
                        value={field.value || ''}
                      />
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select a language' />
                        </SelectTrigger>
                        <SelectContent>
                          {getLanguageOptions().map((language) => (
                            <SelectItem
                              key={language.code}
                              value={language.code}
                            >
                              {language.code} ({language.label})
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
                name='promptId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <div className='flex gap-2'>
                      <FormControl>
                        <Select
                          key={localPrompts.length}
                          value={field.value === null ? 'default' : field.value}
                          onValueChange={(value) =>
                            field.onChange(value === 'default' ? null : value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select a prompt' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='default'>
                              Default Prompt
                            </SelectItem>
                            {localPrompts.map((prompt) => (
                              <SelectItem key={prompt.id} value={prompt.id}>
                                {prompt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={handlePromptButtonClick}
                      >
                        {selectedPromptId === null
                          ? 'Create New Prompt'
                          : 'Edit Prompt'}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='threshold'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relevance Threshold ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name='strategy.provider'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>News Source</FormLabel>
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
                      <FormItem>
                        <FormLabel>Search Query</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='artificial intelligence'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
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
                  <FormItem>
                    <FormLabel>Update Frequency</FormLabel>
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
                      <FormItem>
                        <FormLabel>Article Count</FormLabel>
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
                      <FormItem>
                        <FormLabel>Schedule</FormLabel>
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
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Separator />
              <div className='space-y-4'>
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
                          Everynews will only gather & send alerts when the
                          alert is marked active.
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
                          Should others be able to subscribe to this alert?
                        </p>
                      </div>
                    </div>
                  )}
                />
              </div>

              <div className='flex justify-between gap-2'>
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() => router.push('/my/alerts')}
                >
                  Cancel
                </Button>
                <div className='flex gap-2'>
                  <SubmitButton
                    variant='outline'
                    onClick={onTest}
                    loading={isTesting}
                  >
                    Test
                  </SubmitButton>
                  <SubmitButton
                    onClick={form.handleSubmit(onSubmit)}
                    loading={isSubmitting}
                  >
                    Create
                  </SubmitButton>
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className='space-y-4'>
          <Card className='p-6 bg-background'>
            {isTesting ? (
              <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                <Loader2 className='size-4 animate-spin' />
              </div>
            ) : testResults && testResults.length > 0 ? (
              <AlertPreview stories={testResults} />
            ) : (
              <div className='text-center text-muted-foreground py-12'>
                <p>Click "Test" to preview your alert</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <PromptDialog
        mode={promptDialogMode}
        prompt={selectedPrompt}
        open={promptDialogOpen}
        onOpenChange={setPromptDialogOpen}
        onSuccess={
          promptDialogMode === 'create'
            ? handlePromptCreated
            : handlePromptUpdated
        }
      />
    </div>
  )
}
