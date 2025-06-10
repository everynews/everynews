import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { Separator } from '@everynews/components/ui/separator'
import { db } from '@everynews/database'
import { ContentSchema, contents } from '@everynews/schema/content'
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { StorySchema, stories } from '@everynews/schema/story'
import { eq } from 'drizzle-orm'
import { ArrowLeft, Calendar, ExternalLink, Globe } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Get story with content and newsletter information
  const rawStoryData = await db
    .select({
      content: contents,
      newsletter: newsletter,
      story: stories,
    })
    .from(stories)
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .innerJoin(newsletter, eq(stories.newsletterId, newsletter.id))
    .where(eq(stories.id, id))
    .limit(1)

  if (!rawStoryData.length) {
    notFound()
  }

  const {
    story: rawStory,
    content: rawContent,
    newsletter: rawNewsletter,
  } = rawStoryData[0]

  // Parse with Zod schemas
  const story = StorySchema.parse(rawStory)
  const content = ContentSchema.parse(rawContent)
  const newsletterInfo = NewsletterSchema.parse(rawNewsletter)

  return (
    <div className='container mx-auto max-w-4xl p-4'>
      {/* Header */}
      <div className='mb-6'>
        <Link
          href={`/newsletters/${newsletterInfo.id}`}
          className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4'
        >
          <ArrowLeft className='size-4 mr-1' />
          Back to {newsletterInfo.name}
        </Link>

        <div className='space-y-4'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Globe className='size-4' />
            <Link
              href={`/newsletters/${newsletterInfo.id}`}
              className='hover:underline'
            >
              {newsletterInfo.name}
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

          <div className='flex gap-2'>
            <Link href={content.url} target='_blank' rel='noopener noreferrer'>
              <Button variant='outline'>
                <ExternalLink className='size-4 mr-2' />
                View Original
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Findings */}
      {story.keyFindings && story.keyFindings.length > 0 && (
        <Card className='mb-6'>
          <CardHeader>
            <h2 className='text-lg font-semibold'>Key Findings</h2>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {story.keyFindings.map((finding, index) => (
                <div
                  key={`${story.id}-finding-${index}`}
                  className='flex items-start gap-2'
                >
                  <Badge
                    variant='secondary'
                    className='mt-0.5 text-xs px-2 py-1'
                  >
                    {index + 1}
                  </Badge>
                  <p className='flex-1 text-sm'>{finding}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className='my-6' />

      {/* Article Content */}
      <Card>
        <CardHeader>
          <h2 className='text-lg font-semibold'>Article Content</h2>
          <p className='text-sm text-muted-foreground'>
            This content has been processed and formatted for better
            readability.
          </p>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='bg-muted/30 rounded-lg p-4'>
              <p className='text-sm text-muted-foreground mb-2'>
                📄 Content will be loaded from: {content.markdownBlobUrl}
              </p>
              <p className='text-sm text-muted-foreground'>
                💡 Note: The actual article content would be fetched from the
                blob storage and rendered here. This could include formatted
                markdown or HTML content.
              </p>
            </div>

            {/* Placeholder for actual content */}
            <div className='prose prose-sm max-w-none'>
              <p className='text-muted-foreground italic'>
                [Article content would be dynamically loaded and rendered here
                from the blob storage URL]
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className='mt-8 pt-6 border-t'>
        <div className='flex justify-between items-center'>
          <Link
            href={`/newsletters/${newsletterInfo.id}`}
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            ← Back to newsletter
          </Link>

          <Link
            href={content.url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-muted-foreground hover:text-foreground'
          >
            View original source ↗
          </Link>
        </div>
      </div>
    </div>
  )
}
