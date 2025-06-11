import { Badge } from '@everynews/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@everynews/components/ui/card'
import { db } from '@everynews/database'
import { NewsletterSchema, newsletter } from '@everynews/schema/newsletter'
import { stories } from '@everynews/schema/story'
import { subscriptions } from '@everynews/schema/subscription'
import { count, eq } from 'drizzle-orm'
import { FileText, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewslettersPage() {
  // First get newsletter data with story counts
  const newslettersWithStories = await db
    .select({
      newsletter: newsletter,
      storyCount: count(stories.id),
    })
    .from(newsletter)
    .leftJoin(stories, eq(newsletter.id, stories.newsletterId))
    .where(eq(newsletter.isPublic, true))
    .groupBy(newsletter.id)

  // Then get subscriber counts for each newsletter
  const subscriberCounts = await db
    .select({
      newsletterId: subscriptions.newsletterId,
      subscriberCount: count(subscriptions.id),
    })
    .from(subscriptions)
    .groupBy(subscriptions.newsletterId)

  // Create a map for quick lookup
  const subscriberMap = new Map(
    subscriberCounts.map(({ newsletterId, subscriberCount }) => [
      newsletterId,
      subscriberCount,
    ]),
  )

  // Parse and combine the data
  const newslettersData = newslettersWithStories
    .map(({ newsletter: newsletterData, storyCount }) => ({
      newsletter: NewsletterSchema.parse(newsletterData),
      storyCount,
      subscriberCount: subscriberMap.get(newsletterData.id) || 0,
    }))
    .sort((a, b) => b.subscriberCount - a.subscriberCount)

  return (
    <>
      <div className='container mx-auto p-4'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {newslettersData.map(
            ({ newsletter: newsletterInfo, storyCount, subscriberCount }) => (
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
                      {newsletterInfo.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {newsletterInfo.description}
                        </p>
                      )}
                      <div className='flex items-center justify-between text-sm text-muted-foreground'>
                        <div className='flex items-center gap-2'>
                          <FileText className='size-4' />
                          <span>
                            {storyCount}{' '}
                            {storyCount === 1 ? 'story' : 'stories'}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Users className='size-4' />
                          <span>
                            {subscriberCount}{' '}
                            {subscriberCount === 1
                              ? 'subscriber'
                              : 'subscribers'}
                          </span>
                        </div>
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
      </div>
    </>
  )
}
