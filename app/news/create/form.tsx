'use client'

import { api } from '@everynews/app/api'
import { Button } from '@everynews/components/ui/button'
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
import { Label } from '@everynews/components/ui/label'
import {
  RadioGroup,
  RadioGroupItem,
} from '@everynews/components/ui/radio-group'
import { Separator } from '@everynews/components/ui/separator'
import { toast } from '@everynews/components/ui/sonner'
import { Switch } from '@everynews/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@everynews/components/ui/tabs'
import { Textarea } from '@everynews/components/ui/textarea'
import { toastNetworkError } from '@everynews/lib/error'
import {
  type NewsletterDto,
  NewsletterDtoSchema,
} from '@everynews/schema/newsletter'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'

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

export const CreateNewsForm = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const id = useId()
  const switchActiveId = useId()
  const switchPublicId = useId()

  const [scheduleDays, setScheduleDays] = useState<string[]>([])
  const [scheduleHours, setScheduleHours] = useState<number[]>([])

  const defaultValues: NewsletterDto = {
    active: true,
    isPublic: true,
    name: '',
    strategy: { provider: 'hnbest' },
    wait: { type: 'count', value: 10 },
  }

  const form = useForm<NewsletterDto>({
    defaultValues,
    resolver: zodResolver(NewsletterDtoSchema),
  })

  const onSubmit = async (values: NewsletterDto) => {
    setIsSubmitting(true)
    try {
      const apiData: NewsletterDto = {
        active: values.active,
        isPublic: values.isPublic,
        name: values.name,
        strategy:
          values.strategy.provider === 'exa'
            ? { provider: 'exa', query: values.strategy.query || '' }
            : { provider: 'hnbest' },
        wait: values.wait,
      }
      const res = await api.news.$post({ json: apiData })
      if (!res.ok) {
        toast.error('Failed to create news')
        return
      }
      toast.success('News Created Successfully')
      router.push('/news')
      router.refresh()
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const strategyProvider = form.watch('strategy.provider')
  const waitType = form.watch('wait.type')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem className='md:flex md:items-center md:justify-between'>
              <div className='md:w-1/2'>
                <FormLabel className='text-lg'>
                  How should we call this news?
                </FormLabel>
              </div>
              <div className='md:w-1/2'>
                <FormControl>
                  <Input placeholder='Daily Tech News' {...field} />
                </FormControl>
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
              <div className='md:w-1/2'>
                <FormLabel className='text-lg'>
                  Where should we collect news from?
                </FormLabel>
              </div>
              <div className='md:w-1/2'>
                <FormControl>
                  <RadioGroup
                    className='gap-2 xl:grid xl:grid-cols-2'
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    {/* Hacker News */}
                    <label
                      htmlFor={`${id}-hnbest`}
                      className='cursor-pointer border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'
                    >
                      <RadioGroupItem
                        value='hnbest'
                        id={`${id}-hnbest`}
                        aria-describedby={`${id}-hnbest-description`}
                        className='order-1 after:absolute after:inset-0'
                      />
                      <div className='flex grow items-center gap-3'>
                        <div className='grid grow gap-2'>
                          <span className='font-medium'>
                            Hacker News Best Stories
                          </span>
                          <p
                            id={`${id}-hnbest-description`}
                            className='text-muted-foreground text-sm'
                          >
                            Hacker News is a social board where users submit and
                            vote on technical articles. Best Stories are the top
                            articles based on user votes.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Exa */}
                    <label
                      htmlFor={`${id}-exa`}
                      className='cursor-pointer border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'
                    >
                      <RadioGroupItem
                        value='exa'
                        id={`${id}-exa`}
                        aria-describedby={`${id}-exa-description`}
                        className='order-1 after:absolute after:inset-0'
                      />
                      <div className='flex grow items-start gap-3'>
                        <div className='grid grow gap-2'>
                          <span className='font-medium'>Search Exa AI</span>
                          <p
                            id={`${id}-exa-description`}
                            className='text-muted-foreground text-sm'
                          >
                            Exa is a neural search engine similar to Google's
                            Search Engine Result Page.
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
                  <div className='md:w-1/2'>
                    <FormLabel className='text-lg'>
                      What query should we monitor?
                    </FormLabel>
                  </div>
                  <div className='md:w-1/2'>
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
              <div className='md:w-1/2'>
                <FormLabel className='text-lg'>
                  How often should we send you updates?
                </FormLabel>
              </div>
              <div className='md:w-1/2'>
                <FormControl>
                  <RadioGroup
                    className='gap-2'
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
                      <div className='grid grow gap-2'>
                        <Label htmlFor={`${id}-count`}>Based on Count</Label>
                        <p className='text-muted-foreground text-sm'>
                          Send me updates only when there are enough news
                          collected
                        </p>
                      </div>
                      <RadioGroupItem
                        value='count'
                        id={`${id}-count`}
                        className='order-1'
                      />
                    </div>
                    <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none'>
                      <div className='grid grow gap-2'>
                        <Label htmlFor={`${id}-schedule`}>
                          Based on Schedule
                        </Label>
                        <p className='text-muted-foreground text-sm'>
                          Send me updates based on periodic schedule
                        </p>
                      </div>
                      <RadioGroupItem
                        value='schedule'
                        id={`${id}-schedule`}
                        className='order-1'
                      />
                    </div>
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
                  <div className='md:w-1/2'>
                    <FormLabel className='text-lg'>
                      How many articles do you want in one news?
                    </FormLabel>
                  </div>
                  <div className='md:w-1/2'>
                    <FormControl>
                      <Tabs
                        defaultValue={String(field.value)}
                        className='w-full'
                      >
                        <TabsList className='flex w-full'>
                          {[10, 20, 30].map((count) => (
                            <TabsTrigger
                              key={count}
                              value={count.toString()}
                              onClick={() => field.onChange(count)}
                              className='flex-1'
                            >
                              {count}
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
                  <div className='md:w-1/2'>
                    <FormLabel className='text-lg'>
                      On what schedule should we send you updates?
                    </FormLabel>
                  </div>
                  <div className='md:w-1/2'>
                    <div className='flex flex-wrap gap-8'>
                      {/* Days */}
                      <div className='space-y-2'>
                        <Label className='font-medium'>Days</Label>
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day} className='flex items-center gap-2'>
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
                            <Label htmlFor={`${id}-day-${day}`}>{day}</Label>
                          </div>
                        ))}
                      </div>

                      {/* Hours */}
                      <div className='space-y-2'>
                        <Label className='font-medium'>Hours</Label>
                        <div className='grid grid-cols-2 gap-2'>
                          {HOURS_2_INTERVAL.map((h) => (
                            <div key={h} className='flex items-center gap-2'>
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
                              <Label
                                htmlFor={`${id}-hour-${h}`}
                              >{`${h.toString().padStart(2, '0')}:00`}</Label>
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

        <FormItem className='md:flex md:items-start md:justify-between'>
          <div className='md:w-1/2'>
            <FormLabel className='text-lg'>
              Are there anything else you want to configure?{' '}
            </FormLabel>
          </div>
          <div className='md:w-1/2'>
            <FormControl>
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
                        <Label htmlFor={switchActiveId}>Active</Label>
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
                        <Label htmlFor={switchPublicId}>Public</Label>
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
          </div>
        </FormItem>

        <div className='flex justify-end'>
          <Link href='/news'>
            <Button type='button' variant='outline' className='mr-2'>
              Cancel
            </Button>
          </Link>
          <Button type='submit' disabled={isSubmitting} className='flex gap-1'>
            {isSubmitting && <Loader2 className='size-4 animate-spin' />}
            <Save className='size-4' />
            Create
          </Button>
        </div>
      </form>
    </Form>
  )
}
