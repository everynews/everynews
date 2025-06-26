import { db } from '@everynews/database'
import { Header } from '@everynews/lib/header'
import { subscriptions } from '@everynews/schema'
import { Button } from '@everynews/ui/button'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const getSubscriptionDetails = async (subscriptionId: string) => {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
    with: {
      alert: true,
      user: true,
    },
  })

  return subscription
}

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

  const subscription = await getSubscriptionDetails(subscriptionId)

  if (!subscription) {
    notFound()
  }

  const isAlreadyUnsubscribed = subscription.deletedAt !== null
  const userName = subscription.user.name || subscription.user.email
  const alertName = subscription.alert.name

  return (
    <>
      <Header />
      <main className='container mx-auto px-4 py-8 max-w-md'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>
            {isAlreadyUnsubscribed ? 'Unsubscribed' : 'Unsubscribe'}
          </h1>

          {isAlreadyUnsubscribed ? (
            <div className='space-y-4'>
              <p className='text-gray-600'>
                {userName}, you have unsubscribed from "{alertName}".
              </p>
              <Link href='/'>
                <Button variant='outline'>Go to Home</Button>
              </Link>
            </div>
          ) : (
            <div className='space-y-4'>
              <p className='text-gray-600'>
                {userName}, are you sure you want to unsubscribe from "
                {alertName}"?
              </p>

              <form
                action={async () => {
                  'use server'
                  await unsubscribe(subscriptionId)
                }}
              >
                <Button type='submit' variant='destructive' className='w-full'>
                  Yes, Unsubscribe
                </Button>
              </form>

              <Link href='/'>
                <Button variant='outline' className='w-full'>
                  Keep My Subscription
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
