import { whoami } from '@everynews/auth/session'
import { SubscribeAlertButton } from '@everynews/components/subscribe-alert-button'
import { Badge } from '@everynews/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { AlertSchema, alert } from '@everynews/schema/alert'
import {
  type Channel,
  ChannelSchema,
  channels,
} from '@everynews/schema/channel'
import { stories } from '@everynews/schema/story'
import {
  type Subscription,
  SubscriptionSchema,
  subscriptions,
} from '@everynews/schema/subscription'
import { and, count, eq, isNull } from 'drizzle-orm'
import { FileText, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  description: 'Browse public alerts.',
  title: 'Alerts',
}

export default async function AlertsPage() {
  // Get current user and their data
  const user = await whoami()

  // Get user's channels if logged in
  let userChannels: Channel[] = []
  let userSubscriptions: Subscription[] = []

  if (user) {
    const channelsRes = await db
      .select()
      .from(channels)
      .where(and(eq(channels.userId, user.id), isNull(channels.deletedAt)))
    userChannels = ChannelSchema.array().parse(channelsRes)

    const subscriptionsRes = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.userId, user.id), isNull(subscriptions.deletedAt)),
      )
    userSubscriptions = SubscriptionSchema.array().parse(subscriptionsRes)
  }

  // First get alert data with story counts
  const alertsWithStories = await db
    .select({
      alert: alert,
      storyCount: count(stories.id),
    })
    .from(alert)
    .leftJoin(
      stories,
      and(eq(alert.id, stories.alertId), isNull(stories.deletedAt)),
    )
    .where(and(eq(alert.isPublic, true), isNull(alert.deletedAt)))
    .groupBy(alert.id)

  // Then get subscriber counts for each alert
  const subscriberCounts = await db
    .select({
      alertId: subscriptions.alertId,
      subscriberCount: count(subscriptions.id),
    })
    .from(subscriptions)
    .where(isNull(subscriptions.deletedAt))
    .groupBy(subscriptions.alertId)

  // Create a map for quick lookup
  const subscriberMap = new Map(
    subscriberCounts.map(({ alertId, subscriberCount }) => [
      alertId,
      subscriberCount,
    ]),
  )

  // Parse and combine the data
  const alertsData = alertsWithStories
    .map(({ alert: alertData, storyCount }) => {
      const userSubscription = userSubscriptions.find(
        (sub) => sub.alertId === alertData.id,
      )
      return {
        alert: AlertSchema.parse(alertData),
        storyCount,
        subscriberCount: subscriberMap.get(alertData.id) || 0,
        userSubscription,
      }
    })
    .sort((a, b) => b.subscriberCount - a.subscriberCount)

  return (
    <>
      <div className='container mx-auto p-4'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {alertsData.map(
            ({
              alert: alertInfo,
              storyCount,
              subscriberCount,
              userSubscription,
            }) => (
              <Link href={`/alerts/${alertInfo.id}`} key={alertInfo.id}>
                <Card className='h-full hover:shadow-md transition-shadow'>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <CardTitle className='text-lg line-clamp-2 cursor-pointer'>
                          {alertInfo.name}
                        </CardTitle>
                      </div>
                      <Badge
                        variant={alertInfo.active ? 'default' : 'secondary'}
                      >
                        {alertInfo.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className='flex flex-col gap-3'>
                      {alertInfo.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {alertInfo.description}
                        </p>
                      )}
                      <div className='flex items-center justify-between text-sm text-muted-foreground'>
                        <div className='flex items-center gap-2'>
                          <FileText className='size-4' />
                          <span>
                            {storyCount}{' '}
                            {storyCount === 1 ? 'story' : 'stories'}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Users className='size-4' />
                          <span>
                            {subscriberCount}{' '}
                            {subscriberCount === 1
                              ? 'subscriber'
                              : 'subscribers'}
                          </span>
                        </div>
                      </div>
                      {alertInfo.strategy.query && (
                        <Badge
                          className='text-muted-foreground text-xs'
                          variant='outline'
                        >
                          {alertInfo.strategy.query}
                        </Badge>
                      )}
                      <div className='flex items-center justify-end'>
                        {user &&
                          userChannels.length > 0 &&
                          alertInfo.userId !== user.id && (
                            <SubscribeAlertButton
                              alert={alertInfo}
                              channels={userChannels}
                              subscription={userSubscription ?? undefined}
                              user={user}
                            />
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ),
          )}
        </div>
      </div>
    </>
  )
}
