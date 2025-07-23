import { guardUser } from '@everynews/auth/session'
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

export default async function Page() {
  const user = await guardUser()

  if (!user) {
    return null
  }

  // Fetch stories for all user's alerts
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
    .where(and(eq(subscriptions.userId, user.id), isNull(stories.deletedAt)))
    .orderBy(desc(stories.createdAt))
    .limit(20)

  const triggeredStories = await storyQuery

  return (
    <>
      <h2 className='text-lg font-semibold mb-3'>Recent Stories</h2>

      <div className='grid grid-cols-1 gap-4'>
        {triggeredStories.map(({ story, alert: alertInfo }) => (
          <Link
            key={`${story.id}-${alertInfo.id}`}
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
                      {story.keyFindings.slice(0, 3).map((finding, index) => (
                        <div
                          key={`${story.id}-${alertInfo.id}-finding-${index}`}
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
              Subscribe to alerts to see stories here
            </p>
          </Card>
        )}
      </div>
    </>
  )
}
