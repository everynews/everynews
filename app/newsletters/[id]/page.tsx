import { Badge } from '@everynews/components/ui/badge'
import { Button } from '@everynews/components/ui/button'
import { Card, CardContent, CardHeader } from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { contents } from '@everynews/schema/content'
import { newsletter } from '@everynews/schema/newsletter'
import { stories } from '@everynews/schema/story'
import { desc, eq } from 'drizzle-orm'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

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
      <h1 className='text-2xl font-bold text-center'>{newsletterInfo.name}</h1>

      <div className='container mx-auto max-w-prose p-4 space-y-6'>
        {storiesData.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-muted-foreground'>
              No stories found for this newsletter yet.
            </p>
          </div>
        ) : (
          <>
            <div className='space-y-4 grid gap-4'>
              {storiesData.map(({ story }) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className='hover:shadow-md transition-shadow cursor-pointer m-0'
                >
                  <Card>
                    <CardHeader className='pb-3'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mt-2 text-sm text-muted-foreground'>
                          <Calendar className='size-4' />
                          <time dateTime={story.createdAt.toISOString()}>
                            {story.createdAt.toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </time>
                        </div>
                        <h2 className='text-xl font-semibold line-clamp-2'>
                          {story.title}
                        </h2>
                      </div>
                    </CardHeader>

                    {Array.isArray(story.keyFindings) &&
                      story.keyFindings.length > 0 && (
                        <CardContent className='pt-0'>
                          <div className='space-y-2'>
                            <h3 className='text-sm font-medium text-muted-foreground'>
                              Key Findings
                            </h3>
                            <div className='space-y-2'>
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
