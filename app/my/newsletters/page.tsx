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
import { PromptSchema, prompt } from '@everynews/schema/prompt'
import { subscriptions } from '@everynews/schema/subscription'
import { eq } from 'drizzle-orm'
import { Edit, Eye, Trash2 } from 'lucide-react'
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
          <h1 className='text-3xl font-bold'>Newsletters</h1>
          <p className='text-muted-foreground mt-2'>
            Manage your AI-powered newsletters
          </p>
        </div>
        <NewsletterDialog mode='create' prompts={userPrompts} />
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
            {news.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center text-muted-foreground py-8'
                >
                  No newsletters yet. Create your first newsletter to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => {
                const subscription = userSubscriptions.find(
                  (sub) => sub.newsletterId === item.id,
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
                          <Link href={`/newsletters/${item.id}`}>
                            <Eye className='size-4' />
                          </Link>
                        </Button>
                        <SubscribeNewsletterButton
                          newsletter={item}
                          channels={userChannels}
                          subscription={subscription}
                        />
                        <NewsletterDialog
                          mode='edit'
                          original={item}
                          prompts={userPrompts}
                          trigger={
                            <Button size='sm' variant='ghost'>
                              <Edit className='size-4' />
                            </Button>
                          }
                        />
                        <DeleteNewsletterPopover
                          newsletter={item}
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
