import { whoami } from '@everynews/auth/session'
import { DeleteAlertPopover } from '@everynews/components/delete-alert-popover'
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
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { subscriptions } from '@everynews/schema/subscription'
import { and, eq, isNull } from 'drizzle-orm'
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
    <div className='container mx-auto max-w-6xl'>
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

      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userAlerts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center text-muted-foreground py-8'
                >
                  No alerts yet. Create your first alert to get started.
                </TableCell>
              </TableRow>
            ) : (
              userAlerts.map((item) => {
                const subscription = userSubscriptions.find(
                  (sub) => sub.alertId === item.id,
                )
                return (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>
                      <Link
                        href={`/my/alerts/${item.id}`}
                        lang={item.languageCode}
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.active ? 'default' : 'outline'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {item.threshold}
                    </TableCell>
                    <TableCell className='flex items-center gap-1 justify-end'>
                      <SubscribeAlertButton
                        alert={item}
                        channels={userChannels}
                        subscription={subscription}
                        user={user}
                      />

                      <Button asChild size='sm' variant='ghost'>
                        <Link href={`/alerts/${item.id}`}>View</Link>
                      </Button>
                      <Button asChild size='sm' variant='ghost'>
                        <Link href={`/my/alerts/${item.id}`}>Edit</Link>
                      </Button>
                      <DeleteAlertPopover alert={item}>
                        <Button variant='ghost' className='text-destructive'>
                          Delete
                        </Button>
                      </DeleteAlertPopover>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
