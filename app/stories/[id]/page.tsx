import { getUser } from '@everynews/auth/session'
import { SubscribeSimilarStories } from '@everynews/components/subscribe-similar-stories'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { url } from '@everynews/lib/url'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { contents } from '@everynews/schema/content'
import { StorySchema, stories } from '@everynews/schema/story'
import { and, eq, isNull } from 'drizzle-orm'
import { Calendar, ExternalLink, Globe } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CopyMarkdownButton } from './copy-markdown-button'
import { ShareButton } from './share-button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = await db.query.stories.findFirst({
    where: and(eq(stories.id, id), isNull(stories.deletedAt)),
  })

  return {
    description:
      Array.isArray(post?.keyFindings) && post.keyFindings.length > 0
        ? post.keyFindings.slice(0, 3).join(' ')
        : null,
    openGraph: {
      images: [
        {
          url: `/api/og?id=${id}`,
        },
      ],
    },
    title: post?.title ?? 'Story',
  }
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const rawResponse = await db
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
    .where(and(eq(stories.id, id), isNull(stories.deletedAt)))
    .limit(1)

  if (!rawResponse || rawResponse.length === 0) {
    notFound()
  }
  const [raw] = rawResponse
  const { alert, story } = raw

  const storyData = StorySchema.parse(story)
  const alertData = AlertSchema.parse(alert)

  // Check if user is authenticated
  const user = await getUser()

  // Check if this story has a Hacker News ID in metadata
  const hnItemId = storyData.metadata?.hackerNewsId

  return (
    <div
      className='container mx-auto max-w-4xl p-4'
      lang={storyData.languageCode}
    >
      <div className='mb-6'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Globe className='size-4' />
            <Link
              href={`/alerts/${alertData.id}`}
              className='hover:underline'
              lang={alertData.languageCode}
            >
              {alertData.name}
            </Link>
            <span>•</span>
            <Calendar className='size-4' />
            <time dateTime={storyData.createdAt.toISOString()}>
              {storyData.createdAt.toLocaleDateString('en-US', {
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>

          <h1 className='text-3xl font-bold leading-tight'>
            {storyData.title}
          </h1>
        </div>
      </div>
      {storyData.keyFindings && storyData.keyFindings.length > 0 && (
        <Card>
          <CardContent className='p-4'>
            <div className='flex flex-col gap-2'>
              {storyData.keyFindings.map((finding, index) => (
                <div
                  key={`${storyData.id}-finding-${index}`}
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
      <div className='pt-6'>
        <div className='flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center'>
          <div className='flex gap-2 flex-wrap'>
            <Link
              href={`${storyData.originalUrl}${storyData.originalUrl.includes('?') ? '&' : '?'}utm_source=every.news`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm text-muted-foreground hover:text-foreground flex items-center gap-2'
            >
              <Button variant='outline' className='text-sm'>
                <ExternalLink className='size-4' />
                Source
              </Button>
            </Link>
            {hnItemId && (
              <Link
                href={`https://news.ycombinator.com/item?id=${hnItemId}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-muted-foreground hover:text-foreground flex items-center gap-2'
              >
                <Button variant='outline' className='text-sm'>
                  <ExternalLink className='size-4' />
                  Show Thread
                </Button>
              </Link>
            )}
          </div>
          <div className='flex gap-2'>
            <CopyMarkdownButton
              title={storyData.title}
              url={`${url}/stories/${storyData.id}`}
              content={storyData.keyFindings ?? []}
            />
            <ShareButton
              title={storyData.title}
              url={`${url}/stories/${storyData.id}`}
            />
          </div>
        </div>
      </div>

      {/* Subscribe to similar stories form - only show for non-authenticated users */}
      {!user && (
        <div className='pt-8'>
          <SubscribeSimilarStories alert={alertData} />
        </div>
      )}
    </div>
  )
}
