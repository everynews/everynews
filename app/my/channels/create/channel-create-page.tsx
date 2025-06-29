'use client'

import { api } from '@everynews/app/api'
import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
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
import { toastNetworkError } from '@everynews/lib/error'
import {
  type ChannelDto,
  ChannelDtoSchema,
  ChannelSchema,
} from '@everynews/schema/channel'
import { zodResolver } from '@hookform/resolvers/zod'
import { humanId } from 'human-id'
import { Mail, Phone, Slack } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const ChannelCreatePage = () => {
  const router = useRouter()
  const emailId = useId()
  const phoneId = useId()
  const slackId = useId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [channelType, setChannelType] = useState<'email' | 'phone' | 'slack'>(
    'email',
  )
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [verificationChannelId, setVerificationChannelId] = useState<
    string | null
  >(null)

  const form = useForm<ChannelDto>({
    defaultValues: {
      config: { destination: '' },
      name: humanId({ capitalize: false, separator: '-' }),
      type: channelType,
    } as ChannelDto,
    resolver: zodResolver(ChannelDtoSchema),
  })

  // Update form when channel type changes
  useEffect(() => {
    form.setValue('type', channelType)
    if (channelType !== 'slack') {
      form.setValue('config.destination', '')
    }
  }, [channelType, form])

  const onSubmit = async (values: ChannelDto) => {
    // Handle Slack channel type differently
    if (channelType === 'slack') {
      window.location.href = '/api/slack/install'
      return
    }

    setIsSubmitting(true)
    try {
      const res = await api.channels.$post({ json: values })

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage = errorData?.error || 'Failed to create channel'
        toast.error(errorMessage)
        return
      }

      const createdChannel = ChannelSchema.parse(await res.json())
      const channelId = createdChannel?.id

      if (channelId) {
        // Automatically send verification for new channels
        try {
          const verifyRes = await api.channels[':id'][
            'send-verification'
          ].$post({
            param: { id: channelId },
          })
          const verifyData = (await verifyRes.json()) as {
            success: boolean
            isPhone?: boolean
          }

          if (verifyData.isPhone) {
            // Show verification code input for phone
            setVerificationChannelId(channelId)
            setShowVerificationInput(true)
            toast.success(
              `Channel "${form.watch('name')}" created! Verification code sent to ${form.watch('config.destination')}.`,
            )
            return // Don't navigate away yet
          } else {
            toast.success(
              `Channel "${form.watch('name')}" created! Verification email sent.`,
            )
          }
        } catch (error) {
          toast.success(
            `Channel "${form.watch('name')}" created, but failed to send verification.
            Please send verification manually.`,
            {
              description: JSON.stringify(error),
            },
          )
        }
      } else {
        toast.success(`Channel "${form.watch('name')}" created.`)
      }

      router.push('/my/channels')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onVerifyPhone = async () => {
    if (!verificationChannelId || !verificationCode) return

    setIsSubmitting(true)
    try {
      const res = await api.channels[':id']['verify-phone'].$post({
        json: { code: verificationCode },
        param: { id: verificationChannelId },
      })

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string }
        toast.error(errorData?.error || 'Verification failed')
        return
      }

      toast.success('Phone number verified successfully!')
      router.push('/my/channels')
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold'>Create Channel</h1>
        <p className='text-muted-foreground mt-1'>
          Add a new delivery channel for your alerts
        </p>
      </div>
      {showVerificationInput ? (
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-muted-foreground'>
            Enter the 6-digit verification code sent to{' '}
            {form.watch('config.destination')}
          </p>
          <Input
            type='text'
            inputMode='numeric'
            pattern='[0-9]{6}'
            maxLength={6}
            placeholder='123456'
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(e.target.value.replace(/\D/g, ''))
            }
          />
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/my/channels')}
            >
              Cancel
            </Button>
            <SubmitButton
              onClick={onVerifyPhone}
              loading={isSubmitting}
              disabled={verificationCode.length !== 6}
            >
              Verify
            </SubmitButton>
          </div>
        </div>
      ) : (
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
                    <Input
                      placeholder={
                        channelType === 'phone'
                          ? 'My SMS Channel'
                          : channelType === 'slack'
                            ? 'My Slack Channel'
                            : 'My Email Channel'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormItem>
              <FormLabel>Channel Type</FormLabel>
              <RadioGroup
                value={channelType}
                onValueChange={(value) =>
                  setChannelType(value as 'email' | 'phone' | 'slack')
                }
                className='gap-2 lg:grid lg:grid-cols-3'
              >
                <label
                  htmlFor={emailId}
                  className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
                >
                  <RadioGroupItem
                    value='email'
                    id={emailId}
                    aria-describedby={`${emailId}-description`}
                    className='order-1 after:absolute after:inset-0'
                  />
                  <div className='flex grow items-start gap-3'>
                    <div className='grid grow gap-2'>
                      <span className='font-medium flex items-center gap-2'>
                        <Mail className='size-4' />
                        Email
                      </span>
                      <p
                        id={`${emailId}-description`}
                        className='text-muted-foreground text-sm'
                      >
                        Receive alerts via email. Perfect for daily digests and
                        important updates.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  htmlFor={phoneId}
                  className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
                >
                  <RadioGroupItem
                    value='phone'
                    id={phoneId}
                    aria-describedby={`${phoneId}-description`}
                    className='order-1 after:absolute after:inset-0'
                  />
                  <div className='flex grow items-start gap-3'>
                    <div className='grid grow gap-2'>
                      <span className='font-medium flex items-center gap-2'>
                        <Phone className='size-4' />
                        SMS
                      </span>
                      <p
                        id={`${phoneId}-description`}
                        className='text-muted-foreground text-sm'
                      >
                        Get instant notifications via text message for
                        time-sensitive alerts.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  htmlFor={slackId}
                  className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none cursor-pointer'
                >
                  <RadioGroupItem
                    value='slack'
                    id={slackId}
                    aria-describedby={`${slackId}-description`}
                    className='order-1 after:absolute after:inset-0'
                  />
                  <div className='flex grow items-start gap-3'>
                    <div className='grid grow gap-2'>
                      <span className='font-medium flex items-center gap-2'>
                        <Slack className='size-4' />
                        Slack
                      </span>
                      <p
                        id={`${slackId}-description`}
                        className='text-muted-foreground text-sm'
                      >
                        Share alerts with your team in Slack channels for
                        collaborative monitoring.
                      </p>
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </FormItem>

            <Separator />

            {channelType === 'slack' ? (
              <div className='rounded-lg border bg-muted/50 p-4'>
                <p className='text-sm text-muted-foreground mb-2'>
                  You'll be redirected to Slack to connect your workspace and
                  select a channel.
                </p>
                <p className='text-sm text-muted-foreground'>
                  Make sure you have permission to install apps in your Slack
                  workspace.
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name='config.destination'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {channelType === 'phone'
                        ? 'Phone Number'
                        : 'Email Address'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          channelType === 'phone'
                            ? '+1234567890'
                            : 'you@example.com'
                        }
                        type={channelType === 'phone' ? 'tel' : 'email'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/my/channels')}
              >
                Cancel
              </Button>
              {channelType === 'slack' ? (
                <Button asChild>
                  <Link href='/api/slack/install'>Connect Slack</Link>
                </Button>
              ) : (
                <Button type='submit' disabled={isSubmitting}>
                  Create
                </Button>
              )}
            </div>
          </form>
        </Form>
      )}
    </>
  )
}
