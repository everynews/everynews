'use cache'

import { Badge } from '@everynews/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { stories } from '@everynews/schema/story'
import { subscriptions } from '@everynews/schema/subscription'
import { and, count, eq, isNull } from 'drizzle-orm'
import { FileText, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  description: 'Browse public alerts.',
  openGraph: {
    images: [
      {
        url: '/api/og?title=Alerts&description=Browse public alerts.',
      },
    ],
  },
  title: 'Alerts',
}

export default async function AlertsPage() {
  const alertsWithStories = await db
    .select({
      alert: alerts,
      storyCount: count(stories.id),
    })
    .from(alerts)
    .leftJoin(
      stories,
      and(eq(alerts.id, stories.alertId), isNull(stories.deletedAt)),
    )
    .where(and(eq(alerts.isPublic, true), isNull(alerts.deletedAt)))
    .groupBy(alerts.id)

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
      return {
        alert: AlertSchema.parse(alertData),
        storyCount,
        subscriberCount: subscriberMap.get(alertData.id) || 0,
      }
    })
    .sort((a, b) => b.subscriberCount - a.subscriberCount)

  return (
    <>
      <div className='container mx-auto p-4'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {alertsData.map(
            ({ alert: alertInfo, storyCount, subscriberCount }) => (
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
