import { Badge } from '@everynews/components/ui/badge'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { contents } from '@everynews/schema/content'
import { newsletter } from '@everynews/schema/newsletter'
import { stories } from '@everynews/schema/story'
import { desc, eq } from 'drizzle-orm'
import { Calendar, Globe } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page() {
  // Get recent stories from all public newsletters
  const recentStories = await db
    .select({
      content: contents,
      newsletter: newsletter,
      story: stories,
    })
    .from(stories)
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .innerJoin(newsletter, eq(stories.newsletterId, newsletter.id))
    .where(eq(newsletter.isPublic, true))
    .orderBy(desc(stories.createdAt))
    .limit(20)

  return (
    <div className='container mx-auto p-4 space-y-6'>
      <div className='space-y-2 max-w-prose mx-auto grid gap-4'>
        {recentStories.map(({ story, newsletter: newsletterInfo }) => (
          <Link key={story.id} href={`/stories/${story.id}`}>
            <Card className='hover:shadow-md transition-shadow cursor-pointer max-w-prose break-words'>
              <CardHeader className='pb-3'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2 text-sm text-muted-foreground flex-wrap'>
                    <Globe className='size-4' />
                    <span className='hover:underline'>
                      {newsletterInfo.name}
                    </span>
                    <span>•</span>
                    <Calendar className='size-4' />
                    <time dateTime={story.createdAt.toISOString()}>
                      {story.createdAt.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  <h2 className='text-xl font-semibold line-clamp-2 break-words'>
                    {story.title}
                  </h2>
                </div>
              </CardHeader>

              {Array.isArray(story.keyFindings) &&
                story.keyFindings.length > 0 && (
                  <CardContent className='pt-0'>
                    <div className='space-y-2'>
                      <div className='space-y-2'>
                        {story.keyFindings.slice(0, 3).map((finding, index) => (
                          <div
                            key={`${story.id}-finding-${index}`}
                            className='flex items-start gap-2'
                          >
                            <Badge
                              variant='secondary'
                              className='text-xs px-2 py-1 flex-shrink-0'
                            >
                              {index + 1}
                            </Badge>
                            <p className='flex-1 text-sm text-muted-foreground break-words'>
                              {finding}
                            </p>
                          </div>
                        ))}
                        {story.keyFindings.length > 3 && (
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant='outline'
                              className='text-xs px-2 py-1'
                            >
                              +{story.keyFindings.length - 3}
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                              more findings
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
