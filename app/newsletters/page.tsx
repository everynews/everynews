import { Badge } from '@everynews/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { stories } from '@everynews/schema/story'
import { count, desc, eq } from 'drizzle-orm'
import { Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewslettersPage() {
  const rawData = await db
    .select({
      newsletter: newsletter,
      storyCount: count(stories.id),
    })
    .from(newsletter)
    .leftJoin(stories, eq(newsletter.id, stories.newsletterId))
    .where(eq(newsletter.isPublic, true))
    .groupBy(newsletter.id)
    .orderBy(desc(newsletter.createdAt))

  // Parse the newsletter data properly
  const newslettersData = rawData.map(
    ({ newsletter: newsletterData, storyCount }) => ({
      newsletter: NewsletterSchema.parse(newsletterData),
      storyCount,
    }),
  )

  return (
    <>
      <div className='container mx-auto p-4'>
        {newslettersData.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-muted-foreground'>
              No public newsletters available yet.
            </p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {newslettersData.map(
              ({ newsletter: newsletterInfo, storyCount }) => (
                <Link
                  key={newsletterInfo.id}
                  href={`/newsletters/${newsletterInfo.id}`}
                >
                  <Card className='h-full hover:shadow-md transition-shadow cursor-pointer'>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <CardTitle className='text-lg line-clamp-2'>
                            {newsletterInfo.name}
                          </CardTitle>
                          <CardDescription className='mt-2'>
                            <div className='flex items-center gap-2 text-sm'>
                              <Calendar className='size-4' />
                              <span>
                                Created{' '}
                                {newsletterInfo.createdAt.toLocaleDateString(
                                  'en-US',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  },
                                )}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            newsletterInfo.active ? 'default' : 'secondary'
                          }
                        >
                          {newsletterInfo.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <FileText className='size-4' />
                          <span>
                            {storyCount}{' '}
                            {storyCount === 1 ? 'story' : 'stories'}
                          </span>
                        </div>
                        {newsletterInfo.strategy.provider === 'exa' &&
                          newsletterInfo.strategy.query && (
                            <Badge className='text-muted-foreground'>
                              {newsletterInfo.strategy.query}
                            </Badge>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ),
            )}
          </div>
        )}
      </div>
    </>
  )
}
