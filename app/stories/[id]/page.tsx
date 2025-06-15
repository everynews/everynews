import { Badge } from '@everynews/components/ui/badge'
import { Card, CardContent } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { AlertSchema, alert } from '@everynews/schema/alert'
import { ContentSchema, contents } from '@everynews/schema/content'
import { StorySchema, stories } from '@everynews/schema/story'
import { eq } from 'drizzle-orm'
import { ArrowLeft, Calendar, Globe } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Full story from a subscribed alert.',
  title: 'Story Details',
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Get story with content and alert information
  const rawStoryData = await db
    .select({
      alert: alert,
      content: contents,
      story: stories,
    })
    .from(stories)
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .innerJoin(alert, eq(stories.alertId, alert.id))
    .where(eq(stories.id, id))
    .limit(1)

  if (!rawStoryData.length) {
    notFound()
  }

  const {
    story: rawStory,
    content: rawContent,
    alert: rawAlert,
  } = rawStoryData[0]

  // Parse with Zod schemas
  const story = StorySchema.parse(rawStory)
  const content = ContentSchema.parse(rawContent)
  const alertInfo = AlertSchema.parse(rawAlert)
  return (
    <div className='container mx-auto max-w-4xl p-4'>
      {/* Header */}
      <div className='mb-6'>
        <Link
          href={`/alerts/${alertInfo.id}`}
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
        >
          <ArrowLeft className='size-4 mr-1' />
          Back to {alertInfo.name}
        </Link>

        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Globe className='size-4' />
            <Link href={`/alerts/${alertInfo.id}`} className='hover:underline'>
              {alertInfo.name}
            </Link>
            <span>•</span>
            <Calendar className='size-4' />
            <time dateTime={story.createdAt.toISOString()}>
              {story.createdAt.toLocaleDateString('en-US', {
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>

          <h1 className='text-3xl font-bold leading-tight'>{story.title}</h1>
        </div>
      </div>
      {story.keyFindings && story.keyFindings.length > 0 && (
        <Card>
          <CardContent className='p-4'>
            <div className='flex flex-col gap-2'>
              {story.keyFindings.map((finding, index) => (
                <div
                  key={`${story.id}-finding-${index}`}
                  className='flex items-center gap-2'
                >
                  <Badge variant='secondary' className='text-xs px-2 py-1'>
                    {index + 1}
                  </Badge>
                  <p className='flex-1 text-sm'>{finding}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className='mt-8 pt-6 border-t'>
        <div className='flex justify-between items-center'>
          <Link
            href={`/alerts/${alertInfo.id}`}
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            ← Back to Alerts
          </Link>

          <Link
            href={`https://${content.url}`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            View Original Source ↗
          </Link>
        </div>
      </div>
    </div>
  )
}
