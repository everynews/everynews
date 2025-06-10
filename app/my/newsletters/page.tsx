import { whoami } from '@everynews/auth/session'
import { DeleteNewsletterPopover } from '@everynews/components/delete-newsletter-popover'
import { NewsletterDialog } from '@everynews/components/newsletter-dialog'
import { SubscribeNewsletterButton } from '@everynews/components/subscribe-newsletter-button'
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
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { subscriptions } from '@everynews/schema/subscription'
import { eq } from 'drizzle-orm'
import { Edit } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MyNewslettersPage() {
  const user = await whoami()
  if (!user) return unauthorized()

  // Get user's newsletters
  const res = await db
    .select()
    .from(newsletter)
    .where(eq(newsletter.userId, user.id))
  const news = NewsletterSchema.array().parse(res)

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

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center px-3'>
        <div>
          <h2 className='text-2xl font-bold'>My Newsletters</h2>
          <p className='text-muted-foreground'>
            What topics interest you?
          </p>
        </div>
        <NewsletterDialog mode='create' />
      </div>

      {news.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground mb-4'>
            You haven't created any newsletters yet.
          </p>
          <NewsletterDialog mode='create' />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((item) => {
              const subscription = userSubscriptions.find(
                (sub) => sub.newsletterId === item.id,
              )
              return (
                <TableRow key={item.id}>
                  <TableCell className='font-medium text-blue-500'>
                    <Link href={`/newsletters/${item.id}`}>{item.name}</Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.active ? 'default' : 'outline'}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={subscription?.channelId ? 'default' : 'outline'}>
                      {subscription?.channelId ? 'Subscribed' : 'Not Subscribed'}
                    </Badge>
                  </TableCell>
                  <TableCell className='flex gap-2 justify-end'>
                    <SubscribeNewsletterButton
                      newsletter={item}
                      channels={userChannels}
                      subscription={subscription}
                    />
                    <NewsletterDialog
                      mode='edit'
                      original={item}
                      trigger={
                        <Button variant='outline' size='sm'>
                          <Edit className='size-4 mr-1' />
                          Edit
                        </Button>
                      }
                    />
                    <DeleteNewsletterPopover newsletter={item} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
