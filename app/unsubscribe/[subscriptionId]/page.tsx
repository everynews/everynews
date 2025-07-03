import { db } from '@everynews/database'
import { subscriptions } from '@everynews/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { UnsubscribeForm } from './unsubscribe-form'

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
      <UnsubscribeForm
        subscriptionId={subscriptionId}
        userName={userName}
        alertName={alertName}
        isAlreadyUnsubscribed={isAlreadyUnsubscribed}
      />
    </main>
  )
}
