import { whoami } from '@everynews/auth/session'
import { SubscribeNewsletterButton } from '@everynews/components/subscribe-newsletter-button'
import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import {
  type Channel,
  ChannelSchema,
  channels,
} from '@everynews/schema/channel'
import { contents } from '@everynews/schema/content'
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { stories } from '@everynews/schema/story'
import {
  type Subscription,
  SubscriptionSchema,
  subscriptions,
} from '@everynews/schema/subscription'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Recent stories from this newsletter.',
  title: 'Newsletter Stories',
}

export default async function NewsletterStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const { page = '1' } = await searchParams

  const currentPage = Math.max(1, parseInt(page, 10))
  const itemsPerPage = 10
  const offset = (currentPage - 1) * itemsPerPage

  // Get newsletter details
  const newsletterData = await db
    .select()
    .from(newsletter)
    .where(eq(newsletter.id, id))
    .limit(1)

  if (!newsletterData.length) {
    notFound()
  }

  const newsletterInfo = newsletterData[0]

  // Check access permissions
  const user = await whoami()
  const isOwner = user?.id === newsletterInfo.userId
  const isPublic = newsletterInfo.isPublic

  // If newsletter is not public and user is not the owner, show 404
  if (!isPublic && !isOwner) {
    notFound()
  }

  // Get user's channels and subscription for this newsletter
  let userChannels: Channel[] = []
  let userSubscription: Subscription | null = null

  if (user) {
    // Get user's channels
    const channelsRes = await db
      .select()
      .from(channels)
      .where(eq(channels.userId, user.id))
    userChannels = ChannelSchema.array().parse(channelsRes)

    // Check if user is subscribed to this newsletter
    const subscriptionRes = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.newsletterId, id),
        ),
      )
      .limit(1)

    userSubscription = subscriptionRes[0]
      ? SubscriptionSchema.parse(subscriptionRes[0])
      : null
  }

  // Get stories for this newsletter with content joined
  const storiesData = await db
    .select({
      content: contents,
      story: stories,
    })
    .from(stories)
    .innerJoin(contents, eq(stories.contentId, contents.id))
    .where(eq(stories.newsletterId, id))
    .orderBy(desc(stories.createdAt))
    .limit(itemsPerPage)
    .offset(offset)

  // Get total count for pagination
  const totalStories = await db
    .select({ count: stories.id })
    .from(stories)
    .where(eq(stories.newsletterId, id))

  const totalPages = Math.ceil(totalStories.length / itemsPerPage)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  return (
    <>
      <div className='flex flex-col text-center gap-2 mb-6'>
        <div className='flex items-center justify-center gap-4'>
          <h1 className='text-2xl font-bold'>{newsletterInfo.name}</h1>
          {user && !isOwner && userChannels.length > 0 && (
            <SubscribeNewsletterButton
              newsletter={NewsletterSchema.parse(newsletterInfo)}
              channels={userChannels}
              subscription={userSubscription ?? undefined}
            />
          )}
        </div>
        {newsletterInfo.description && (
          <p className='text-muted-foreground'>{newsletterInfo.description}</p>
        )}
      </div>

      <div className='container mx-auto max-w-prose p-4 flex flex-col gap-6'>
        {storiesData.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-muted-foreground'>
              No stories found for this newsletter yet.
            </p>
          </div>
        ) : (
          <>
            <div className='grid gap-4'>
              {storiesData.map(({ story }) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className='hover:shadow-md transition-shadow cursor-pointer m-0'
                >
                  <Card>
                    <CardHeader className='text-xl font-semibold line-clamp-2'>
                      {story.title}
                    </CardHeader>

                    {Array.isArray(story.keyFindings) &&
                      story.keyFindings.length > 0 && (
                        <CardContent className='pt-0'>
                          <div className='flex flex-col gap-2'>
                            {story.keyFindings
                              .slice(0, 3)
                              .map((finding, index) => (
                                <div
                                  key={`${story.id}-finding-${index}`}
                                  className='flex items-center gap-2'
                                >
                                  <Badge
                                    variant='secondary'
                                    className='text-xs px-2 py-1 flex-shrink-0'
                                  >
                                    {index + 1}
                                  </Badge>
                                  <p className='flex-1 text-sm text-muted-foreground'>
                                    {finding}
                                  </p>
                                </div>
                              ))}
                            {story.keyFindings.length > 3 && (
                              <div className='flex items-center gap-2'>
                                <span className='text-xs text-muted-foreground'>
                                  +{story.keyFindings.length - 3} more findings
                                </span>
                              </div>
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
              <div className='flex justify-center gap-2 mt-8'>
                {hasPrevPage && (
                  <Link href={`/newsletters/${id}?page=${currentPage - 1}`}>
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
                        href={`/newsletters/${id}?page=${pageNum}`}
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
                  <Link href={`/newsletters/${id}?page=${currentPage + 1}`}>
                    <Button variant='outline'>Next</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
