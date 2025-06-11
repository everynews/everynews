import { whoami } from '@everynews/auth/session'
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
import {
  SubscriptionSchema,
  subscriptions,
} from '@everynews/schema/subscription'
import { eq } from 'drizzle-orm'
import { Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MySubscriptionsPage() {
  const user = await whoami()
  if (!user) return unauthorized()

  // Get user's subscriptions with related newsletter and channel data
  const subscriptionsRes = await db
    .select({
      channel: channels,
      newsletter: newsletter,
      subscription: subscriptions,
    })
    .from(subscriptions)
    .innerJoin(newsletter, eq(subscriptions.newsletterId, newsletter.id))
    .innerJoin(channels, eq(subscriptions.channelId, channels.id))
    .where(eq(subscriptions.userId, user.id))

  // Parse the results with Zod schemas
  const userSubscriptions = subscriptionsRes.map((row) => ({
    channel: ChannelSchema.parse(row.channel),
    newsletter: NewsletterSchema.parse(row.newsletter),
    subscription: SubscriptionSchema.parse(row.subscription),
  }))

  // Get user's channels for unsubscribe button
  const userChannelsRes = await db
    .select()
    .from(channels)
    .where(eq(channels.userId, user.id))
  const userChannels = ChannelSchema.array().parse(userChannelsRes)

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center px-3'>
        <div>
          <h2 className='text-2xl font-bold'>My Subscriptions</h2>
          <p className='text-muted-foreground'>
            Newsletters you're subscribed to
          </p>
        </div>
      </div>

      {userSubscriptions.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground mb-4'>
            You haven't subscribed to any newsletters yet.
          </p>
          <Link href='/newsletters'>
            <Button>Browse Newsletters</Button>
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Newsletter</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userSubscriptions.map(({ subscription, newsletter, channel }) => (
              <TableRow key={subscription.id}>
                <TableCell className='font-medium text-blue-500'>
                  <Link href={`/newsletters/${newsletter.id}`}>
                    {newsletter.name}
                  </Link>
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
                  <Badge variant={newsletter.active ? 'default' : 'outline'}>
                    {newsletter.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className='text-sm text-muted-foreground'>
                    {subscription.createdAt.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex gap-2 justify-end'>
                    <Link href={`/newsletters/${newsletter.id}`}>
                      <Button variant='outline' size='sm'>
                        View Stories
                      </Button>
                    </Link>
                    <SubscribeNewsletterButton
                      newsletter={newsletter}
                      channels={userChannels}
                      subscription={subscription}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
