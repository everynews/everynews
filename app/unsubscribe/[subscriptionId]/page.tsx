import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { subscriptions } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const unsubscribe = async (subscriptionId: string) => {
  'use server'

  await db
    .update(subscriptions)
    .set({ deletedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
}

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>
}) {
  const { subscriptionId } = await params

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
    with: {
      alert: true,
      user: true,
    },
  })

  if (!subscription) {
    notFound()
  }

  const isAlreadyUnsubscribed = subscription.deletedAt !== null
  const userName = subscription.user?.name || subscription.user?.email
  const alertName = subscription.alert?.name

  return (
    <main className='container mx-auto px-4 py-8 max-w-md'>
      {isAlreadyUnsubscribed ? (
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
      ) : (
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center text-center gap-4'>
              <h1 className='text-2xl font-bold'>Confirm Unsubscription</h1>
              <p className='text-muted-foreground'>
                {userName}, are you sure you want to unsubscribe from "
                {alertName}"?
              </p>
              <p className='text-sm text-muted-foreground'>
                You will no longer receive notifications for this alert.
              </p>

              <form
                action={async () => {
                  'use server'
                  await unsubscribe(subscriptionId)
                }}
                className='w-full mt-4'
              >
                <Button type='submit' variant='destructive' className='w-full'>
                  Yes, Unsubscribe
                </Button>
              </form>

              <Link href='/' className='w-full'>
                <Button variant='outline' className='w-full'>
                  Keep My Subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
