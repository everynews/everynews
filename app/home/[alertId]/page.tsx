import { whoami } from '@everynews/auth/session'
import { SidebarLinkWithBadge } from '@everynews/components/sidebar-link-with-badge'
import { Badge } from '@everynews/components/ui/badge'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { contents } from '@everynews/schema/content'
import { stories } from '@everynews/schema/story'
import { subscriptions } from '@everynews/schema/subscription'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default async function Page({
  params,
}: {
  params: Promise<{ alertId: string }>
}) {
  const user = await whoami()
  const { alertId: selectedAlertId } = await params

  if (!user) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='p-8 text-center'>
          <p className='text-muted-foreground'>
            Please sign in to view your dashboard
          </p>
          <Link
            href='/sign-in'
            className='text-primary hover:underline text-sm mt-2 inline-block'
          >
            Sign in
          </Link>
        </Card>
      </div>
    )
  }

  // Fetch user's subscribed alerts with story counts
  const userAlerts = await db
    .select({
      alert: alerts,
      storyCount: sql<number>`count(distinct ${stories.id})`,
    })
    .from(subscriptions)
    .innerJoin(
      alerts,
      and(eq(subscriptions.alertId, alerts.id), isNull(alerts.deletedAt)),
    )
    .leftJoin(
      stories,
      and(eq(stories.alertId, alerts.id), isNull(stories.deletedAt)),
    )
    .where(
      and(eq(subscriptions.userId, user.id), isNull(subscriptions.deletedAt)),
    )
    .groupBy(alerts.id)
    .orderBy(desc(alerts.updatedAt))

  // Fetch stories for the selected alert
  const storyQuery = db
    .select({
      alert: alerts,
      content: contents,
      story: stories,
    })
    .from(stories)
    .innerJoin(
      contents,
      and(eq(stories.contentId, contents.id), isNull(contents.deletedAt)),
    )
    .innerJoin(
      alerts,
      and(eq(stories.alertId, alerts.id), isNull(alerts.deletedAt)),
    )
    .innerJoin(
      subscriptions,
      and(
        eq(subscriptions.alertId, alerts.id),
        isNull(subscriptions.deletedAt),
      ),
    )
    .where(
      and(
        eq(subscriptions.userId, user.id),
        isNull(stories.deletedAt),
        eq(alerts.id, selectedAlertId),
      ),
    )
    .orderBy(desc(stories.createdAt))
    .limit(20)

  const triggeredStories = await storyQuery

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Home</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left sidebar - Alert list */}
        <div className='lg:col-span-1'>
          <div className='sticky top-4'>
            <h2 className='text-lg font-semibold mb-3'>Your Alerts</h2>

            <div className='space-y-2'>
              {/* All Alerts option */}
              <SidebarLinkWithBadge
                href='/home'
                title='All Alerts'
                description='View all triggered stories'
              />

              {/* Individual alerts */}
              {userAlerts.map(({ alert: alertItem, storyCount }) => (
                <SidebarLinkWithBadge
                  key={alertItem.id}
                  href={`/home/${alertItem.id}`}
                  title={alertItem.name}
                  description={alertItem.description || undefined}
                  badge={Number(storyCount)}
                />
              ))}

              {userAlerts.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  <FileText className='size-12 mx-auto mb-3 opacity-50' />
                  <p>No alerts subscribed yet</p>
                  <Link
                    href='/alerts'
                    className='text-primary hover:underline text-sm mt-2 inline-block'
                  >
                    Browse alerts
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right content - Triggered stories */}
        <div className='lg:col-span-2'>
          <h2 className='text-lg font-semibold mb-3'>
            {userAlerts.find((a) => a.alert.id === selectedAlertId)?.alert.name}{' '}
            Stories
          </h2>

          <div className='grid grid-cols-1 gap-4'>
            {triggeredStories.map(({ story, alert: alertInfo }) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                lang={story.languageCode}
              >
                <Card className='hover:shadow-lg transition-all duration-200 cursor-pointer'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground mb-2'>
                      <Badge variant='secondary' className='text-xs'>
                        {alertInfo.name}
                      </Badge>
                      <span>•</span>
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
                            .slice(0, 2)
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
                          {story.keyFindings.length > 2 && (
                            <p className='text-xs text-muted-foreground'>
                              +{story.keyFindings.length - 2} more insights
                            </p>
                          )}
                        </div>
                      </CardContent>
                    )}
                </Card>
              </Link>
            ))}

            {triggeredStories.length === 0 && (
              <Card className='p-8 text-center text-muted-foreground'>
                <FileText className='size-12 mx-auto mb-3 opacity-50' />
                <p>No stories found</p>
                <p className='text-sm mt-1'>
                  This alert has no triggered stories yet
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const generateStaticParams = async () => {
  const rows = await db
    .select({ id: alerts.id })
    .from(alerts)
    .where(isNull(alerts.deletedAt))

  return rows.map(({ id }) => ({ id }))
}
