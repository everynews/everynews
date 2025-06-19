import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { AlertSchema, alerts } from '@everynews/schema/alert'
import { contents } from '@everynews/schema/content'
import { StorySchema, stories } from '@everynews/schema/story'
import { and, eq, isNull } from 'drizzle-orm'
import { Calendar, ExternalLink, Globe } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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
        ? post.keyFindings.join(' ')
        : null,
    openGraph: {
      images: [
        {
          url: `/api/og?title=${post?.title}&description=${Array.isArray(post?.keyFindings) && post.keyFindings.length > 0 ? post.keyFindings.join(' ') : ''}`,
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
  return (
    <div className='container mx-auto max-w-4xl p-4'>
      <div className='mb-6'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Globe className='size-4' />
            <Link href={`/alerts/${alertData.id}`} className='hover:underline'>
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
        <div className='flex justify-between items-center'>
          <Link
            href={storyData.originalUrl + '?utm_source=every.news'}
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-muted-foreground hover:text-foreground flex items-center gap-2'
          >
            <Button variant='outline' className='text-sm'>
              <ExternalLink className='size-4' />
              Source
            </Button>
          </Link>
          <ShareButton
            title={storyData.title}
            url={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/stories/${storyData.id}`}
          />
        </div>
      </div>
    </div>
  )
}

export const generateStaticParams = async () => {
  const rows = await db
    .select({ id: stories.id })
    .from(stories)
    .where(isNull(stories.deletedAt))

  return rows.map(({ id }) => ({ id }))
}
