import { whoami } from '@everynews/auth/session'
import { DeleteNewsletterPopover } from '@everynews/components/delete-newsletter-popover'
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
import Link from 'next/link'
import { unauthorized } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Subscription</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {news.map((item) => {
          const subscription = userSubscriptions.find(
            (sub) => sub.newsletterId === item.id,
          )
          return (
            <TableRow key={item.id}>
              <TableCell className='font-medium'>{item.name}</TableCell>
              <TableCell>
                <Badge variant={item.active ? 'default' : 'outline'}>
                  {item.active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {subscription ? (
                  <Badge variant='default'>Subscribed</Badge>
                ) : (
                  <Badge variant='outline'>Not Subscribed</Badge>
                )}
              </TableCell>
              <TableCell className='flex gap-2'>
                <SubscribeNewsletterButton
                  newsletter={item}
                  channels={userChannels}
                  subscription={subscription}
                />
                <Link href={`/newsletters/edit/${item.id}`}>
                  <Button variant='outline' size='sm'>
                    Edit
                  </Button>
                </Link>
                <DeleteNewsletterPopover newsletter={item} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
