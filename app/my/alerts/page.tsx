import { whoami } from '@everynews/auth/session'
import { AlertDialog } from '@everynews/components/alert-dialog'
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
import { AlertSchema, alert } from '@everynews/schema/alert'
import { ChannelSchema, channels } from '@everynews/schema/channel'
import { PromptSchema, prompt } from '@everynews/schema/prompt'
import { subscriptions } from '@everynews/schema/subscription'
import { eq } from 'drizzle-orm'
import { Edit, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Your created alerts.',
  title: 'Alerts',
}

export default async function MyAlertsPage() {
  const user = await whoami()
  if (!user) return unauthorized()

  // Get user's alerts
  const res = await db.select().from(alert).where(eq(alert.userId, user.id))
  const alerts = AlertSchema.array().parse(res)

  // Get user's channels
  const channelsRes = await db
    .select()
    .from(channels)
    .where(eq(channels.userId, user.id))
  const userChannels = ChannelSchema.array().parse(channelsRes)

  // Get user's subscriptions
  const subscriptionsRes = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
  const userSubscriptions = subscriptionsRes

  // Get user's prompts
  const promptsRes = await db
    .select()
    .from(prompt)
    .where(eq(prompt.userId, user.id))
  const userPrompts = PromptSchema.array().parse(promptsRes)

  return (
    <div className='container mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Alerts</h1>
          <p className='text-muted-foreground mt-2'>
            Manage your AI-powered alerts
          </p>
        </div>
        <AlertDialog mode='create' prompts={userPrompts} />
      </div>

      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className='w-[200px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center text-muted-foreground py-8'
                >
                  No alerts yet. Create your first alert to get started.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((item) => {
                const subscription = userSubscriptions.find(
                  (sub) => sub.alertId === item.id,
                )
                return (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>{item.name}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Badge variant={item.active ? 'default' : 'outline'}>
                          {item.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge
                          variant={
                            subscription?.channelId ? 'default' : 'outline'
                          }
                        >
                          {subscription?.channelId
                            ? 'Subscribed'
                            : 'Not Subscribed'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button asChild size='sm' variant='ghost'>
                          <Link href={`/alerts/${item.id}`}>
                            <Eye className='size-4' />
                          </Link>
                        </Button>
                        <SubscribeAlertButton
                          alert={item}
                          channels={userChannels}
                          subscription={subscription}
                        />
                        <AlertDialog
                          mode='edit'
                          original={item}
                          prompts={userPrompts}
                          trigger={
                            <Button size='sm' variant='ghost'>
                              <Edit className='size-4' />
                            </Button>
                          }
                        />
                        <DeleteAlertPopover
                          alert={item}
                          trigger={
                            <Button size='sm' variant='ghost'>
                              <Trash2 className='size-4' />
                            </Button>
                          }
                        />
                      </div>
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
