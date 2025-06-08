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
import {
  RadioGroup,
  RadioGroupItem,
} from '@everynews/components/ui/radio-group'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ScalingLoader } from './scaling-loader'
import { PageHeader } from './ui/page-header'

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

export const NewsForm = ({
  mode,
  original,
}: {
  mode: 'create' | 'edit'
  original?: Newsletter
}) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const id = useId()
  const switchActiveId = useId()
  const switchPublicId = useId()

  const [scheduleDays, setScheduleDays] = useState<string[]>([])
  const [scheduleHours, setScheduleHours] = useState<number[]>([])

  const createValues: NewsletterDto = {
    active: true,
    isPublic: true,
    name: '',
    strategy: { provider: 'hnbest' },
    wait: { type: 'count', value: 10 },
  }

  const form = useForm<NewsletterDto>({
    defaultValues:
      mode === 'create'
        ? createValues
        : {
            active: original?.active ?? true,
            isPublic: original?.isPublic ?? true,
            name: original?.name || '',
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
        isPublic: values.isPublic,
        name: values.name,
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
          ? `News "${form.watch('name')}" Created.`
          : `News "${form.watch('name')}" Updated.`,
      )
      router.push('/newsletters')
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
    <>
      <PageHeader title={form.watch('name')} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 p-4'>
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
                              Search on a specific query. Everynews uses Exa AI
                              to search the web.
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
                    <div className='md:w-1/2'>
                      <FormLabel className='text-lg'>
                        How often do you want to receive updates?
                      </FormLabel>
                    </div>
                    <div className='md:w-1/2'>
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
                    <div className='md:w-1/2'>
                      <FormLabel className='text-lg'>
                        On what schedule should we send you updates?
                      </FormLabel>
                    </div>
                    <div className='md:w-1/2'>
                      <div className='grid grid-cols-2 gap-8'>
                        <div className='flex flex-col gap-2'>
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
                              <label htmlFor={`${id}-day-${day}`}>{day}</label>
                            </div>
                          ))}
                        </div>

                        <div className='flex flex-col gap-2'>
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
          <FormItem className='grid lg:grid-cols-2 lg:gap-4'>
            <div>
              <FormLabel className='text-lg'>
                Are there anything else you want to configure?{' '}
              </FormLabel>
            </div>

            <FormControl>
              <div className='grid lg:grid-cols-2 gap-4'>
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

          <div className='flex justify-end'>
            <Link href='/newsletters'>
              <Button type='button' variant='outline' className='mr-2'>
                Cancel
              </Button>
            </Link>
            <Button type='submit' disabled={isSubmitting} className='flex'>
              <Save className='size-4' />
              {mode === 'create' ? 'Create' : 'Update'}
              <ScalingLoader loading={isSubmitting} />
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
