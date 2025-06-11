import { whoami } from '@everynews/auth/session'
import { SubscribeNewsletterButton } from '@everynews/components/subscribe-newsletter-button'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import {
  type Channel,
  ChannelSchema,
  channels,
} from '@everynews/schema/channel'
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { stories } from '@everynews/schema/story'
import {
  type Subscription,
  SubscriptionSchema,
  subscriptions,
} from '@everynews/schema/subscription'
import { count, eq } from 'drizzle-orm'
import { FileText, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewslettersPage() {
  // Get current user and their data
  const user = await whoami()

  // Get user's channels if logged in
  let userChannels: Channel[] = []
  let userSubscriptions: Subscription[] = []

  if (user) {
    const channelsRes = await db
      .select()
      .from(channels)
      .where(eq(channels.userId, user.id))
    userChannels = ChannelSchema.array().parse(channelsRes)

    const subscriptionsRes = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
    userSubscriptions = SubscriptionSchema.array().parse(subscriptionsRes)
  }

  // First get newsletter data with story counts
  const newslettersWithStories = await db
    .select({
      newsletter: newsletter,
      storyCount: count(stories.id),
    })
    .from(newsletter)
    .leftJoin(stories, eq(newsletter.id, stories.newsletterId))
    .where(eq(newsletter.isPublic, true))
    .groupBy(newsletter.id)

  // Then get subscriber counts for each newsletter
  const subscriberCounts = await db
    .select({
      newsletterId: subscriptions.newsletterId,
      subscriberCount: count(subscriptions.id),
    })
    .from(subscriptions)
    .groupBy(subscriptions.newsletterId)

  // Create a map for quick lookup
  const subscriberMap = new Map(
    subscriberCounts.map(({ newsletterId, subscriberCount }) => [
      newsletterId,
      subscriberCount,
    ]),
  )

  // Parse and combine the data
  const newslettersData = newslettersWithStories
    .map(({ newsletter: newsletterData, storyCount }) => {
      const userSubscription = userSubscriptions.find(
        (sub) => sub.newsletterId === newsletterData.id,
      )
      return {
        newsletter: NewsletterSchema.parse(newsletterData),
        storyCount,
        subscriberCount: subscriberMap.get(newsletterData.id) || 0,
        userSubscription,
      }
    })
    .sort((a, b) => b.subscriberCount - a.subscriberCount)

  return (
    <>
      <div className='container mx-auto p-4'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {newslettersData.map(
            ({
              newsletter: newsletterInfo,
              storyCount,
              subscriberCount,
              userSubscription,
            }) => (
              <Card
                key={newsletterInfo.id}
                className='h-full hover:shadow-md transition-shadow'
              >
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <Link href={`/newsletters/${newsletterInfo.id}`}>
                        <CardTitle className='text-lg line-clamp-2 hover:text-blue-600 cursor-pointer'>
                          {newsletterInfo.name}
                        </CardTitle>
                      </Link>
                    </div>
                    <Badge
                      variant={newsletterInfo.active ? 'default' : 'secondary'}
                    >
                      {newsletterInfo.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className='space-y-3'>
                    {newsletterInfo.description && (
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {newsletterInfo.description}
                      </p>
                    )}
                    <div className='flex items-center justify-between text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <FileText className='size-4' />
                        <span>
                          {storyCount} {storyCount === 1 ? 'story' : 'stories'}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Users className='size-4' />
                        <span>
                          {subscriberCount}{' '}
                          {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                        </span>
                      </div>
                    </div>
                    {newsletterInfo.strategy.provider === 'exa' &&
                      newsletterInfo.strategy.query && (
                        <Badge className='text-muted-foreground'>
                          {newsletterInfo.strategy.query}
                        </Badge>
                      )}
                    <div className='flex items-center justify-end'>
                      {user &&
                        userChannels.length > 0 &&
                        newsletterInfo.userId !== user.id && (
                          <SubscribeNewsletterButton
                            newsletter={newsletterInfo}
                            channels={userChannels}
                            subscription={userSubscription ?? undefined}
                          />
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    </>
  )
}
