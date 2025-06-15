import { whoami } from '@everynews/auth/session'
import { SubscribeAlertButton } from '@everynews/components/subscribe-alert-button'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@everynews/components/ui/table'
import { db } from '@everynews/database'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { AlertSchema, alert } from '@everynews/schema/alert'
import {
  SubscriptionSchema,
  subscriptions,
} from '@everynews/schema/subscription'
import { eq } from 'drizzle-orm'
import { Eye, Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: "Review alerts you're subscribed to.",
  title: 'Subscriptions',
}

export default async function MySubscriptionsPage() {
  const user = await whoami()
  if (!user) return unauthorized()

  // Get user's subscriptions with related alert and channel data
  const subscriptionsRes = await db
    .select({
      channel: channels,
      alert: alert,
      subscription: subscriptions,
    })
    .from(subscriptions)
    .innerJoin(alert, eq(subscriptions.alertId, alert.id))
    .innerJoin(channels, eq(subscriptions.channelId, channels.id))
    .where(eq(subscriptions.userId, user.id))

  // Parse the results with Zod schemas
  const userSubscriptions = subscriptionsRes.map((row) => ({
    channel: ChannelSchema.parse(row.channel),
    alert: AlertSchema.parse(row.alert),
    subscription: SubscriptionSchema.parse(row.subscription),
  }))

  // Get user's channels for unsubscribe button
  const userChannelsRes = await db
    .select()
    .from(channels)
    .where(eq(channels.userId, user.id))
  const userChannels = ChannelSchema.array().parse(userChannelsRes)

  return (
    <div className='container mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Subscriptions</h1>
          <p className='text-muted-foreground mt-2'>
            Alerts you're subscribed to
          </p>
        </div>
        <Button asChild>
          <Link href='/alerts'>Browse Alerts</Link>
        </Button>
      </div>

      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alert</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className='w-[150px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center text-muted-foreground py-8'
                >
                  No subscriptions yet. Browse alerts to subscribe to one.
                </TableCell>
              </TableRow>
            ) : (
              userSubscriptions.map(({ subscription, alert, channel }) => (
                <TableRow key={subscription.id}>
                  <TableCell className='font-medium'>
                    {alert.name}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {channel.type === 'email' ? (
                        <Mail className='size-4' />
                      ) : (
                        <MessageSquare className='size-4' />
                      )}
                      <span className='capitalize'>{channel.type}</span>
                      <span className='text-muted-foreground text-sm'>
                        ({channel.config.destination})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.active ? 'default' : 'outline'}>
                      {alert.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {subscription.createdAt.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button asChild size='sm' variant='ghost'>
                        <Link href={`/alerts/${alert.id}`}>
                          <Eye className='size-4' />
                        </Link>
                      </Button>
                      <SubscribeAlertButton
                        alert={alert}
                        channels={userChannels}
                        subscription={subscription}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
