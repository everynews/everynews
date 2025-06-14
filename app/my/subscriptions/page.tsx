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
import { Eye, Mail, MessageSquare } from 'lucide-react'
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
    <div className='container mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Subscriptions</h1>
          <p className='text-muted-foreground mt-2'>
            Newsletters you're subscribed to
          </p>
        </div>
        <Button asChild>
          <Link href='/newsletters'>Browse Newsletters</Link>
        </Button>
      </div>

      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Newsletter</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className='w-[150px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center text-muted-foreground py-8'>
                  No subscriptions yet. Browse newsletters to subscribe to one.
                </TableCell>
              </TableRow>
            ) : (
              userSubscriptions.map(({ subscription, newsletter, channel }) => (
                <TableRow key={subscription.id}>
                  <TableCell className='font-medium'>{newsletter.name}</TableCell>
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
                        <Link href={`/newsletters/${newsletter.id}`}>
                          <Eye className='size-4' />
                        </Link>
                      </Button>
                      <SubscribeNewsletterButton
                        newsletter={newsletter}
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