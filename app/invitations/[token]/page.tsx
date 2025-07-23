import { guardUser } from '@everynews/auth/session'
import { InvitationAcceptance } from '@everynews/components/invitation-acceptance'
import { db } from '@everynews/database'
import { invitations, subscriptions } from '@everynews/schema'
import { AlertSchema } from '@everynews/schema/alert'
import { InvitationSchema } from '@everynews/schema/invitation'
import { UserSchema } from '@everynews/schema/user'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Get invitation details
  const invitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.token, token),
      isNull(invitations.acceptedAt),
      gt(invitations.expiresAt, new Date()),
    ),
    with: {
      alert: true,
      inviter: true,
    },
  })

  if (!invitation) {
    notFound()
  }

  // Check if alert is still active and public
  if (!invitation.alert.isPublic || invitation.alert.deletedAt) {
    notFound()
  }

  // Check if user is authenticated
  const user = await guardUser()

  // If user is authenticated, check if they're already subscribed
  let isAlreadySubscribed = false
  if (user) {
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.alertId, invitation.alertId),
        isNull(subscriptions.deletedAt),
      ),
    })
    isAlreadySubscribed = !!existingSubscription
  }

  return (
    <div className='flex items-center justify-center p-4'>
      <InvitationAcceptance
        invitation={InvitationSchema.parse(invitation)}
        alert={AlertSchema.parse(invitation.alert)}
        inviter={UserSchema.parse(invitation.inviter)}
        user={user}
        isAlreadySubscribed={isAlreadySubscribed}
      />
    </div>
  )
}
