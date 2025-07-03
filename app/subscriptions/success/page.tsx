import { whoami } from '@everynews/auth/session'
import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { invitations } from '@everynews/schema/invitation'
import { subscriptions } from '@everynews/schema/subscription'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { CheckCircle2, Home, Settings } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    alertId?: string
    error?: string
    invitationToken?: string
  }>
}) {
  const params = await searchParams
  const { alertId, error, invitationToken } = params

  // Handle error cases
  if (error) {
    return (
      <div className='flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-red-600'>Subscription Failed</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-muted-foreground mb-4'>
              {error === 'invalid_token' &&
                'The confirmation link is invalid or has expired.'}
              {error === 'already_exists' &&
                'You are already subscribed to this alert.'}
              {(!error ||
                (error !== 'invalid_token' && error !== 'already_exists')) &&
                'Something went wrong. Please try again.'}
            </p>
            <Link href='/'>
              <Button>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is authenticated
  const user = await whoami()
  if (!user) {
    redirect('/sign-in')
  }

  // If no alertId, redirect to home
  if (!alertId) {
    redirect('/')
  }

  // Get alert details
  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, alertId), isNull(alerts.deletedAt)),
  })

  if (!alert || (!alert.isPublic && alert.userId !== user.id)) {
    redirect('/')
  }

  // Check if already subscribed
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, user.id),
      eq(subscriptions.alertId, alertId),
      isNull(subscriptions.deletedAt),
    ),
  })

  // If not already subscribed, create the subscription
  if (!existingSubscription) {
    try {
      await db.insert(subscriptions).values({
        alertId,
        channelId: null, // Default channel
        userId: user.id,
      })
    } catch (_error) {
      return redirect(`/subscriptions/success?error=already_exists`)
    }
  }

  // If this is from an invitation, mark it as accepted
  if (invitationToken) {
    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(
        and(
          eq(invitations.token, invitationToken),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      )
  }

  return (
    <div className='flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
            <CheckCircle2 className='size-6 text-green-600 dark:text-green-400' />
          </div>
          <CardTitle>Successfully Subscribed!</CardTitle>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-muted-foreground mb-6'>
            You are now subscribed to <strong>{alert.name}</strong> and will
            receive updates when new stories are published.
          </p>
          <div className='flex flex-col gap-3'>
            <Link href={`/alerts/${alertId}`}>
              <Button className='w-full'>View Alert</Button>
            </Link>
            <Link href='/my/subscriptions'>
              <Button variant='outline' className='w-full'>
                <Settings className='size-4' />
                Manage Subscriptions
              </Button>
            </Link>
            <Link href='/'>
              <Button variant='ghost' className='w-full'>
                <Home className='size-4' />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
