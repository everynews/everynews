import { whoami } from '@everynews/auth/session'
import { InviteToAlertForm } from '@everynews/components/invite-to-alert-form'
import { db } from '@everynews/database'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { and, eq, isNull } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'

export default async function InviteToAlertPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await whoami()

  if (!user) {
    redirect('/sign-in')
  }

  // Get alert details
  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, id), isNull(alerts.deletedAt)),
  })

  if (!alert) {
    notFound()
  }

  // Only allow invites for public alerts
  if (!alert.isPublic) {
    redirect(`/alerts/${id}`)
  }

  return (
    <div className='container mx-auto max-w-2xl p-6'>
      <h1 className='text-2xl font-bold mb-2'>
        Invite people to "{alert.name}"
      </h1>
      <p className='text-muted-foreground mb-6'>
        Send invitations to subscribe to this alert
      </p>

      <InviteToAlertForm alert={AlertSchema.parse(alert)} user={user} />
    </div>
  )
}
