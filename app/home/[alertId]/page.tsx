import { whoami } from '@everynews/auth/session'
import { Badge } from '@everynews/components/ui/badge'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { contents } from '@everynews/schema/content'
import { stories } from '@everynews/schema/story'
import { subscriptions } from '@everynews/schema/subscription'
import { and, desc, eq, isNull } from 'drizzle-orm'
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
    return null
  }

  // Check if user is subscribed to this alert
  const userSubscription = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.alertId, selectedAlertId),
        eq(subscriptions.userId, user.id),
        isNull(subscriptions.deletedAt),
      ),
    )
    .limit(1)

  if (userSubscription.length === 0) {
    return (
      <Card className='p-8 text-center text-muted-foreground'>
        <p>You are not subscribed to this alert</p>
      </Card>
    )
  }

  // Fetch the selected alert details
  const selectedAlert = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.id, selectedAlertId), isNull(alerts.deletedAt)))
    .limit(1)

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
    .where(and(eq(stories.alertId, selectedAlertId), isNull(stories.deletedAt)))
    .orderBy(desc(stories.createdAt))
    .limit(20)

  const triggeredStories = await storyQuery

  return (
    <>
      <h2 className='text-lg font-semibold mb-3'>
        {selectedAlert[0]?.name} Stories
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
                      {story.keyFindings.slice(0, 2).map((finding, index) => (
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
    </>
  )
}

export const generateStaticParams = async () => {
  const rows = await db
    .select({ id: alerts.id })
    .from(alerts)
    .where(isNull(alerts.deletedAt))

  return rows.map(({ id }) => ({ id }))
}
