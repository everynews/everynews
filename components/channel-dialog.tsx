'use client'

import { api } from '@everynews/app/api'
import { FormFieldRow } from '@everynews/components/form-field-row'
import { PhoneInputField } from '@everynews/components/phone-input-field'
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
  RadioGroup,
  RadioGroupItem,
} from '@everynews/components/ui/radio-group'
import { Separator } from '@everynews/components/ui/separator'
import { toastNetworkError } from '@everynews/lib/error'
import {
  type Channel,
  type ChannelDto,
  ChannelDtoSchema,
} from '@everynews/schema/channel'
import { humanId } from 'human-id'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { SubmitButton } from './submit-button'

export const ChannelDialog = ({
  mode,
  original,
  children,
}: {
  mode: 'create' | 'edit'
  original?: Channel
  children?: React.ReactNode
}) => {
  const router = useRouter()
  const emailId = useId()
  const phoneId = useId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const [channelType, setChannelType] = useState<'email' | 'phone'>(
    original?.type === 'phone' ? 'phone' : 'email',
  )
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerificationInput, setShowVerificationInput] = useState(false)
  const [verificationChannelId, setVerificationChannelId] = useState<
    string | null
  >(null)

  const createValues: ChannelDto = {
    config: { destination: '' },
    name: humanId({ capitalize: false, separator: '-' }),
    type: channelType,
  } as ChannelDto

  const form = useForm<ChannelDto>({
    defaultValues:
      mode === 'create'
        ? createValues
        : ({
            config: original?.config || { destination: '' },
            name: original?.name || '',
            type: original?.type || 'email',
          } as ChannelDto),
    resolver: async (data) => {
      const result = ChannelDtoSchema.safeParse(data)
      if (result.success) {
        return { errors: {}, values: result.data }
      }
      return {
        errors: Object.fromEntries(
          result.error.issues.map((issue) => [
            issue.path.join('.'),
            { message: issue.message, type: 'validation' },
          ]),
        ),
        values: {},
      }
    },
  })

  // Update form when channel type changes
  useEffect(() => {
    form.setValue('type', channelType)
    form.setValue('config.destination', '')
  }, [channelType, form])

  const onSubmit = async (values: ChannelDto) => {
    setIsSubmitting(true)
    try {
      let res: Response
      if (mode === 'create') {
        res = await api.channels.$post({ json: values })
      } else {
        if (!original?.id) {
          toast.error('Missing channel ID for update')
          return
        }
        res = await api.channels[':id'].$put({
          json: values,
          param: { id: original.id },
        })
      }

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string }
        const errorMessage = errorData?.error || `Failed to ${mode} channel`
        toast.error(errorMessage)
        return
      }

      if (mode === 'create') {
        // Get the created channel from response
        const createdChannel = await res.json()
        const channelId = Array.isArray(createdChannel)
          ? createdChannel[0]?.id
          : createdChannel?.id

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
              return // Don't close dialog yet
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
      } else {
        // Check if destination was changed for update mode
        let destinationChanged = false
        if (
          original &&
          (original.type === 'email' || original.type === 'phone') &&
          (values.type === 'email' || values.type === 'phone')
        ) {
          const destinationSchema = z.object({ destination: z.string() })
          const originalParsed = destinationSchema.safeParse(original.config)
          const newParsed = destinationSchema.safeParse(values.config)

          if (originalParsed.success && newParsed.success) {
            destinationChanged =
              originalParsed.data.destination !== newParsed.data.destination
          }
        }
        const wasVerified = original?.verified

        if (destinationChanged && wasVerified) {
          const destinationType =
            original?.type === 'phone' ? 'phone number' : 'email address'
          toast.success(`Channel "${form.watch('name')}" updated!`, {
            description: `Please verify the new ${destinationType} to receive alerts.`,
          })
        } else {
          toast.success(`Channel "${form.watch('name')}" updated.`)
        }
      }

      if (!showVerificationInput) {
        setOpen(false)
        if (mode === 'create') {
          form.reset({
            ...createValues,
            name: humanId({ capitalize: false, separator: '-' }),
          })
        } else {
          form.reset()
        }
        router.refresh()
      }
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
      setOpen(false)
      setShowVerificationInput(false)
      setVerificationCode('')
      setVerificationChannelId(null)
      form.reset({
        ...createValues,
        name: humanId({ capitalize: false, separator: '-' }),
      })
      router.refresh()
    } catch (e) {
      toastNetworkError(e as Error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Channel' : 'Edit Channel'}
          </DialogTitle>
        </DialogHeader>
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
                onClick={() => {
                  setShowVerificationInput(false)
                  setVerificationCode('')
                  setOpen(false)
                }}
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
              className='flex flex-col gap-6'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormFieldRow
                    label='What should we call this channel?'
                    labelWidth='1/2'
                  >
                    <FormControl>
                      <Input
                        placeholder={
                          channelType === 'phone'
                            ? 'My SMS Channel'
                            : 'My Email Channel'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormFieldRow>
                )}
              />

              <Separator />

              {mode === 'create' && (
                <>
                  <FormItem className='space-y-3'>
                    <FormLabel>Channel Type</FormLabel>
                    <RadioGroup
                      value={channelType}
                      onValueChange={(value) =>
                        setChannelType(value as 'email' | 'phone')
                      }
                    >
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='email' id={emailId} />
                        <label
                          htmlFor={emailId}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        >
                          Email
                        </label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='phone' id={phoneId} />
                        <label
                          htmlFor={phoneId}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        >
                          SMS (Phone)
                        </label>
                      </div>
                    </RadioGroup>
                  </FormItem>
                  <Separator />
                </>
              )}

              <FormField
                control={form.control}
                name='config.destination'
                render={({ field }) => (
                  <FormFieldRow
                    label={
                      channelType === 'phone' ? 'Phone Number' : 'Email Address'
                    }
                    labelWidth='1/2'
                  >
                    <FormControl>
                      {channelType === 'phone' ? (
                        <PhoneInputField
                          placeholder='Enter phone number'
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      ) : (
                        <Input
                          placeholder='you@example.com'
                          type='email'
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                    {channelType === 'phone' && (
                      <div className='space-y-2'>
                        <p className='text-xs text-muted-foreground'>
                          <strong>Note:</strong> SMS notifications are currently
                          only available for US and Canada phone numbers.
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          By providing your phone number, you authorize
                          Everynews to send automated text alerts to the number
                          provided. Messages and Data rates apply. Message
                          frequency may vary. Text HELP for help or STOP to opt
                          out. See{' '}
                          <Link
                            href='/terms'
                            className='underline hover:text-primary'
                          >
                            terms
                          </Link>{' '}
                          and{' '}
                          <Link
                            href='/privacy'
                            className='underline hover:text-primary'
                          >
                            privacy policy
                          </Link>
                          .
                        </p>
                      </div>
                    )}
                  </FormFieldRow>
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
        )}
      </DialogContent>
    </Dialog>
  )
}
