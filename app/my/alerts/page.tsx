import { whoami } from '@everynews/auth/session'
import { ClickableCard } from '@everynews/components/clickable-card'
import { DeleteAlertPopover } from '@everynews/components/delete-alert-popover'
import { SubscribeAlertButton } from '@everynews/components/subscribe-alert-button'
import { Button } from '@everynews/components/ui/button'
import { db } from '@everynews/database'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { LANGUAGE_LABELS } from '@everynews/schema/language'
import { subscriptions } from '@everynews/schema/subscription'
import { and, eq, isNull } from 'drizzle-orm'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const metadata = {
  description: 'Your created alerts.',
  title: 'Alerts',
}

export default async function MyAlertsPage() {
  const user = await whoami()
  if (!user) return unauthorized()

  // Get user's alerts
  const res = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.userId, user.id), isNull(alerts.deletedAt)))
  const userAlerts = AlertSchema.array().parse(res)

  // Get user's channels
  const channelsRes = await db
    .select()
    .from(channels)
    .where(and(eq(channels.userId, user.id), isNull(channels.deletedAt)))
  const userChannels = ChannelSchema.array().parse(channelsRes)

  // Get user's subscriptions
  const subscriptionsRes = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, user.id), isNull(subscriptions.deletedAt)),
    )
  const userSubscriptions = subscriptionsRes

  return (
    <div className='container mx-auto max-w-6xl px-4 sm:px-6'>
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>Alerts</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your AI-powered alerts
          </p>
        </div>
        <Button asChild>
          <Link href='/my/alerts/create'>Create Alert</Link>
        </Button>
      </div>

      {userAlerts.length === 0 ? (
        <div className='text-center text-muted-foreground py-16 border rounded-lg'>
          No alerts yet. Create your first alert to get started.
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {userAlerts.map((item) => {
            const subscription = userSubscriptions.find(
              (sub) => sub.alertId === item.id,
            )
            return (
              <ClickableCard
                key={item.id}
                href={`/alerts/${item.id}`}
                lang={item.languageCode}
                actions={
                  <div className='flex items-center justify-between'>
                    <DeleteAlertPopover alert={item}>
                      <Button size='icon' variant='destructive'>
                        <Trash2 className='size-4' />
                      </Button>
                    </DeleteAlertPopover>
                    <div className='flex items-center gap-2'>
                      <SubscribeAlertButton
                        alert={item}
                        channels={userChannels}
                        subscription={subscription}
                        user={user}
                      />
                      <Button asChild size='sm' variant='outline'>
                        <Link href={`/my/alerts/${item.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                }
              >
                <h3 className='font-semibold text-lg line-clamp-1 mb-3'>
                  {item.name}
                </h3>

                <div className='space-y-2 text-sm text-muted-foreground mb-4'>
                  <div className='flex justify-between'>
                    <span>Status</span>
                    <span className='text-muted-foreground'>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Language</span>
                    <span className='text-muted-foreground truncate max-w-[150px]'>
                      {LANGUAGE_LABELS[
                        item.languageCode as keyof typeof LANGUAGE_LABELS
                      ] || item.languageCode}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Threshold</span>
                    <span className='text-muted-foreground'>
                      {item.threshold}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Created</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Updated</span>
                    <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </ClickableCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
