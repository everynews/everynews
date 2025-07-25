import { getUser } from '@everynews/auth/session'
import { ManageAlertSubscriptions } from '@everynews/components/manage-alert-subscriptions'
import { OneClickSubscribeForm } from '@everynews/components/one-click-subscribe-form'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import {
  type Channel,
  ChannelSchema,
  channels,
} from '@everynews/schema/channel'
import { contents } from '@everynews/schema/content'
import { stories } from '@everynews/schema/story'
import {
  type Subscription,
  SubscriptionSchema,
  subscriptions,
} from '@everynews/schema/subscription'
import { and, count, desc, eq, isNull } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const { id } = await params
  const alertData = await db.query.alerts.findFirst({
    where: eq(alerts.id, id),
  })
  return {
    description: alertData?.description ?? 'Recent stories from this alert.',
    openGraph: {
      images: [
        {
          url: `/api/og?title=${alertData?.name}&description=${alertData?.description}`,
        },
      ],
    },
    title: alertData?.name ?? 'Alert',
  }
}

export default async function AlertStoriesPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>
}) {
  const { id, pageId } = await params

  const currentPage = Math.max(1, parseInt(pageId, 10))
  const itemsPerPage = 10
  const offset = (currentPage - 1) * itemsPerPage

  // Get alert details
  const alertData = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.id, id), isNull(alerts.deletedAt)))
    .limit(1)

  if (!alertData.length) {
    notFound()
  }

  const alertInfo = alertData[0]

  // Check access permissions
  const user = await getUser()
  const isOwner = user?.id === alertInfo.userId
  const isPublic = alertInfo.isPublic

  // If alert is not public and user is not the owner, show 404
  if (!isPublic && !isOwner) {
    notFound()
  }

  // Get user's channels and subscriptions for this alert
  let userChannels: Channel[] = []
  let userSubscriptions: Subscription[] = []

  if (user) {
    // Get user's channels
    const channelsRes = await db
      .select()
      .from(channels)
      .where(and(eq(channels.userId, user.id), isNull(channels.deletedAt)))
    userChannels = ChannelSchema.array().parse(channelsRes)

    // Get all user's subscriptions for this alert
    const subscriptionsRes = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.alertId, id),
          isNull(subscriptions.deletedAt),
        ),
      )

    userSubscriptions = SubscriptionSchema.array().parse(subscriptionsRes)
  }

  // Get stories for this alert with content joined
  const storiesData = await db
    .select({
      content: contents,
      story: stories,
    })
    .from(stories)
    .innerJoin(
      contents,
      and(eq(stories.contentId, contents.id), isNull(contents.deletedAt)),
    )
    .where(
      and(
        eq(stories.alertId, id),
        isNull(stories.deletedAt),
        eq(stories.userMarkedIrrelevant, false),
        eq(stories.systemMarkedIrrelevant, false),
      ),
    )
    .orderBy(desc(stories.createdAt))
    .limit(itemsPerPage)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: count() })
    .from(stories)
    .where(
      and(
        eq(stories.alertId, id),
        isNull(stories.deletedAt),
        eq(stories.userMarkedIrrelevant, false),
        eq(stories.systemMarkedIrrelevant, false),
      ),
    )

  const totalPages = Math.ceil(total / itemsPerPage)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col text-center gap-2'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <h1 className='text-2xl font-bold'>{alertInfo.name}</h1>
          <div className='flex items-center gap-2'>
            {user && (
              <ManageAlertSubscriptions
                alert={AlertSchema.parse(alertInfo)}
                channels={userChannels}
                subscriptions={userSubscriptions}
                user={user}
                isOwner={isOwner}
              />
            )}
            {!user && (
              <OneClickSubscribeForm alert={AlertSchema.parse(alertInfo)} />
            )}
          </div>
        </div>
        {alertInfo.description && (
          <p className='text-muted-foreground'>{alertInfo.description}</p>
        )}
      </div>

      <div className='container mx-auto max-w-prose p-4 flex flex-col gap-6'>
        {storiesData.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-muted-foreground'>
              No stories found for this alert yet.
            </p>
          </div>
        ) : (
          <>
            <div className='grid gap-4'>
              {storiesData.map(({ story }) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  lang={story.languageCode}
                >
                  <Card className='hover:shadow-lg transition-all duration-200 cursor-pointer'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground mb-2'>
                        <time dateTime={story.createdAt.toISOString()}>
                          {story.createdAt.toLocaleDateString('en-US', {
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </time>
                      </div>
                      <h3 className='font-semibold text-foreground line-clamp-2'>
                        {story.title}
                      </h3>
                    </CardHeader>

                    {Array.isArray(story.keyFindings) &&
                      story.keyFindings.length > 0 && (
                        <CardContent className='pt-0'>
                          <div className='space-y-2'>
                            {story.keyFindings
                              .slice(0, 3)
                              .map((finding, index) => (
                                <div
                                  key={`${story.id}-finding-${index}`}
                                  className='flex items-center gap-2'
                                >
                                  <Badge
                                    variant='outline'
                                    className='text-xs px-1.5 py-0.5 flex-shrink-0'
                                  >
                                    {index + 1}
                                  </Badge>
                                  <p className='text-xs text-muted-foreground line-clamp-2'>
                                    {finding}
                                  </p>
                                </div>
                              ))}
                            {story.keyFindings.length > 3 && (
                              <p className='text-xs text-muted-foreground'>
                                +{story.keyFindings.length - 3} more insights
                              </p>
                            )}
                          </div>
                        </CardContent>
                      )}
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex justify-center gap-2'>
                {hasPrevPage && (
                  <Link href={`/alerts/${id}/page/${currentPage - 1}`}>
                    <Button variant='outline'>Previous</Button>
                  </Link>
                )}

                <div className='flex items-center gap-2'>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i
                    if (pageNum > totalPages) return null

                    return (
                      <Link
                        key={pageNum}
                        href={`/alerts/${id}/page/${pageNum}`}
                      >
                        <Button
                          variant={
                            pageNum === currentPage ? 'default' : 'outline'
                          }
                          size='sm'
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    )
                  })}
                </div>

                {hasNextPage && (
                  <Link href={`/alerts/${id}/page/${currentPage + 1}`}>
                    <Button variant='outline'>Next</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
