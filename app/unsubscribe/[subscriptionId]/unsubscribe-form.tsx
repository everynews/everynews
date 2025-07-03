'use client'

import { SubmitButton } from '@everynews/components/submit-button'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { unsubscribeAction } from './actions'

interface UnsubscribeFormProps {
  subscriptionId: string
  userName: string | null
  alertName: string | undefined
  isAlreadyUnsubscribed: boolean
}

const UnsubscribeSubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <SubmitButton
      type='submit'
      variant='destructive'
      className='w-full'
      loading={pending}
    >
      Yes, Unsubscribe
    </SubmitButton>
  )
}

export const UnsubscribeForm = ({
  subscriptionId,
  userName,
  alertName,
  isAlreadyUnsubscribed,
}: UnsubscribeFormProps) => {
  const [state, formAction] = useActionState(unsubscribeAction, {
    success: false,
  })

  if (state.success || isAlreadyUnsubscribed) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center text-center gap-4'>
            <CheckCircle className='size-12 text-green-600' />
            <h1 className='text-2xl font-bold'>Successfully Unsubscribed</h1>
            <p className='text-muted-foreground'>
              {userName}, you have been unsubscribed from "{alertName}".
            </p>
            <p className='text-sm text-muted-foreground'>
              You will no longer receive notifications for this alert.
            </p>
            <Link href='/' className='mt-4'>
              <Button variant='outline'>Back to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex flex-col items-center text-center gap-4'>
          <h1 className='text-2xl font-bold'>Confirm Unsubscription</h1>
          <p className='text-muted-foreground'>
            {userName}, are you sure you want to unsubscribe from "{alertName}"?
          </p>
          <p className='text-sm text-muted-foreground'>
            You will no longer receive notifications for this alert.
          </p>

          <form action={formAction} className='w-full mt-4'>
            <input type='hidden' name='subscriptionId' value={subscriptionId} />
            <UnsubscribeSubmitButton />
          </form>

          <Link href='/' className='w-full'>
            <Button variant='outline' className='w-full'>
              Keep My Subscription
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
