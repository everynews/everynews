'use client'

import { api } from '@everynews/app/api'
import {
  DAYS_OF_WEEK,
  HOURS_2_INTERVAL,
  STRATEGY_WITH_QUERY,
} from '@everynews/components/alert-form'
import { AlertPreview } from '@everynews/components/alert-preview'
import { DadJokes } from '@everynews/components/dad-jokes'
import { DeletePopover } from '@everynews/components/delete-popover'
import { PromptDialog } from '@everynews/components/prompt-dialog'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { Checkbox } from '@everynews/components/ui/checkbox'
import { Combobox } from '@everynews/components/ui/combobox'
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
import { Separator } from '@everynews/components/ui/separator'
import { Slider } from '@everynews/components/ui/slider'
import { Switch } from '@everynews/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@everynews/components/ui/tabs'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import {
  getHourIntervalLabel,
  getUserTimezone,
  localToUtc,
  utcToLocal,
} from '@everynews/lib/timezone'
import {
  type Alert,
  type AlertDto,
  AlertDtoSchema,
} from '@everynews/schema/alert'
import { getLanguageOptions } from '@everynews/schema/language'
import type { Prompt } from '@everynews/schema/prompt'
import { type Story, StorySchema } from '@everynews/schema/story'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const AlertEditPage = ({
  alert,
  prompts,
}: {
  alert: Alert
  prompts: Prompt[]
}) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<Story[] | null>(null)
  const [countdown, setCountdown] = useState(60)
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

  // Initialize schedule state from alert data
  useEffect(() => {
    if (
      alert.wait.type === 'schedule' &&
      typeof alert.wait.value === 'string'
    ) {
      try {
        const parsed = JSON.parse(alert.wait.value)
        setScheduleDays(parsed.days || [])
        // Convert UTC hours to local hours for display
        const localHours = (parsed.hours || []).map((utcHour: number) =>
          utcToLocal(utcHour),
        )
        setScheduleHours(localHours)
      } catch (e) {
        console.error('Failed to parse schedule data:', e)
      }
    }
  }, [alert.wait])

  const form = useForm<AlertDto>({
    defaultValues: alert,
    resolver: zodResolver(AlertDtoSchema),
  })

  const onSubmit = async (values: AlertDto) => {
    setIsSubmitting(true)
    try {
      // Convert schedule hours from local to UTC if using schedule wait type
      const processedValues = { ...values }
      if (
        values.wait.type === 'schedule' &&
        typeof values.wait.value === 'string'
      ) {
        const schedule = JSON.parse(values.wait.value)
        if (schedule.hours) {
          // Convert each hour from local to UTC
          const utcHours = schedule.hours.map((hour: number) =>
            localToUtc(hour),
          )
          processedValues.wait = {
            ...values.wait,
            value: JSON.stringify({ ...schedule, hours: utcHours }),
          }
        }
      }

      const res = await api.alerts[':id'].$put({
        json: processedValues,
        param: { id: alert.id },
      })

      if (!res.ok) {
        toast.error('Failed to update alert')
        return
      }

      toast.success(`Alert "${form.watch('name')}" updated.`)
      router.push('/my/alerts')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDelete = async () => {
    await api.alerts[':id'].$delete({
      param: { id: alert.id },
    })
    router.push('/my/alerts')
  }

  const onTest = async () => {
    const values = form.getValues()
    setIsTesting(true)
    setTestResults(null)
    setCountdown(60)

    try {
      // Convert schedule hours from local to UTC if using schedule wait type
      const processedValues = { ...values }
      if (
        values.wait.type === 'schedule' &&
        typeof values.wait.value === 'string'
      ) {
        const schedule = JSON.parse(values.wait.value)
        if (schedule.hours) {
          // Convert each hour from local to UTC
          const utcHours = schedule.hours.map((hour: number) =>
            localToUtc(hour),
          )
          processedValues.wait = {
            ...values.wait,
            value: JSON.stringify({ ...schedule, hours: utcHours }),
          }
        }
      }

      const res = await api.drill.$post({ json: processedValues })
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

  useEffect(() => {
    if (isTesting && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isTesting, countdown])

  // Set wait type and value for WHOIS provider
  useEffect(() => {
    if (strategyProvider === 'whois') {
      form.setValue('wait.type', 'count', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      form.setValue('wait.value', 1, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    }
  }, [strategyProvider, form])

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
    <>
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between'>
          Edit Alert
          <div className='flex gap-2 w-full sm:w-auto'>
            <DeletePopover itemName={alert.name} onDelete={onDelete}>
              <Button variant='destructive' size='default'>
                Delete
              </Button>
            </DeletePopover>
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
              Update
            </SubmitButton>
          </div>
        </h1>
        <p className='text-muted-foreground mt-1'>
          Update your alert configuration
        </p>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex flex-col gap-4 sm:gap-6'
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
                name='languageCode'
                render={({ field }) => {
                  const languageOptions = getLanguageOptions()
                  const comboboxOptions = languageOptions.map((option) => ({
                    label: `${option.code} (${option.label})`,
                    value: option.code,
                  }))

                  return (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Combobox
                          options={comboboxOptions}
                          value={field.value || 'en'}
                          onValueChange={field.onChange}
                          placeholder='Select a language'
                          searchPlaceholder='Search languages...'
                          emptyText='No language found.'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name='promptId'
                render={({ field }) => {
                  const comboboxOptions = [
                    { label: 'Default Prompt', value: 'default' },
                    ...localPrompts.map((prompt) => ({
                      label: prompt.name,
                      value: prompt.id,
                    })),
                  ]

                  return (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <div className='flex gap-2'>
                        <FormControl>
                          <Combobox
                            key={localPrompts.length}
                            options={comboboxOptions}
                            value={
                              field.value === null ? 'default' : field.value
                            }
                            onValueChange={(value) =>
                              field.onChange(value === 'default' ? null : value)
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
                          onClick={handlePromptButtonClick}
                        >
                          {selectedPromptId === null
                            ? 'Create New Prompt'
                            : 'Edit Prompt'}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
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
                          htmlFor={`${id}-google`}
                          className=' border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'
                        >
                          <RadioGroupItem
                            value='google'
                            id={`${id}-google`}
                            aria-describedby={`${id}-google-description`}
                            className='order-1 after:absolute after:inset-0 cursor-pointer'
                          />
                          <div className='flex grow items-start gap-3'>
                            <div className='grid grow gap-2'>
                              <span>Online Search</span>
                              <p
                                id={`${id}-google-description`}
                                className='text-muted-foreground text-sm'
                              >
                                Search on a specific query. Everynews uses
                                Google AI to search the web.
                              </p>
                            </div>
                          </div>
                        </label>

                        <label
                          htmlFor={`${id}-github`}
                          className=' border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'
                        >
                          <RadioGroupItem
                            value='github'
                            id={`${id}-github`}
                            aria-describedby={`${id}-github-description`}
                            className='order-1 after:absolute after:inset-0 cursor-pointer'
                          />
                          <div className='flex grow items-start gap-3'>
                            <div className='grid grow gap-2'>
                              <span>GitHub Feeds</span>
                              <p
                                id={`${id}-github-description`}
                                className='text-muted-foreground text-sm'
                              >
                                Monitor GitHub activity feeds. Requires a GitHub
                                personal access token.
                              </p>
                            </div>
                          </div>
                        </label>

                        <label
                          htmlFor={`${id}-whois`}
                          className=' border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'
                        >
                          <RadioGroupItem
                            value='whois'
                            id={`${id}-whois`}
                            aria-describedby={`${id}-whois-description`}
                            className='order-1 after:absolute after:inset-0 cursor-pointer'
                          />
                          <div className='flex grow items-start gap-3'>
                            <div className='grid grow gap-2'>
                              <span>Domain Status</span>
                              <p
                                id={`${id}-whois-description`}
                                className='text-muted-foreground text-sm'
                              >
                                Monitor domain availability. Get alerts when a
                                domain becomes available or expires.
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

              {strategyProvider === 'github' && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name='strategy.token'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub Token</FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder='ghp_xxxxxxxxxxxxx'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {strategyProvider === 'whois' && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name='strategy.domain'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='example.com'
                            {...field}
                            value={field.value || ''}
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
                      {strategyProvider === 'whois' ? (
                        // For WHOIS, only show "Based on Count" option
                        <RadioGroup
                          value='count'
                          onValueChange={field.onChange}
                        >
                          <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
                            <div className='grid grow gap-2'>
                              <span>Based on Count</span>
                              <p className='text-muted-foreground text-sm'>
                                Send alerts immediately when domain becomes
                                available
                              </p>
                            </div>
                            <RadioGroupItem
                              value='count'
                              checked={true}
                              className='order-1'
                              disabled
                            />
                          </div>
                        </RadioGroup>
                      ) : (
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
                      )}
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
                          {strategyProvider === 'whois' ? (
                            // For WHOIS, only show "Immediately" option
                            <RadioGroup
                              value='1'
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                            >
                              <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
                                <div className='grid grow gap-2'>
                                  <span>Immediately</span>
                                  <p className='text-muted-foreground text-sm'>
                                    Send alert as soon as domain becomes
                                    available
                                  </p>
                                </div>
                                <RadioGroupItem
                                  value='1'
                                  checked={true}
                                  className='order-1'
                                  disabled
                                />
                              </div>
                            </RadioGroup>
                          ) : (
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
                          )}
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
                        <div className='text-muted-foreground text-xs mb-2'>
                          Times shown in your local timezone (
                          {getUserTimezone()}) This only applies to "slow"
                          channels, like email. Fast channels, like Slack, will
                          always send immediately on discovery.
                        </div>
                        <div className='grid grid-cols-2 gap-4 sm:gap-8'>
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
                                  <label htmlFor={`${id}-hour-${h}`}>
                                    {getHourIntervalLabel(h)}
                                  </label>
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
                  variant='outline'
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
                    Update
                  </SubmitButton>
                </div>
              </div>
            </form>
          </Form>
        </div>
        <div className='space-y-4'>
          <Card className='min-h-64'>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                {form.watch('name')}
                <div className='tabular-nums text-muted-foreground text-sm'>
                  {isTesting && countdown > 0 ? (
                    <>
                      will be ready in {Math.floor(countdown / 60)}:
                      {(countdown % 60).toString().padStart(2, '0')}...
                    </>
                  ) : null}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isTesting ? (
                <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                  <DadJokes />
                </div>
              ) : testResults && testResults.length > 0 ? (
                <AlertPreview stories={testResults} />
              ) : (
                <div className='text-muted-foreground text-sm'>
                  <p>Ready to test your alert?</p>
                </div>
              )}
            </CardContent>
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
    </>
  )
}
