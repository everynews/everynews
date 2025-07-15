import { whoami } from '@everynews/auth/session'
import { SidebarLinkWithBadge } from '@everynews/components/sidebar-link-with-badge'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { stories } from '@everynews/schema/story'
import { subscriptions } from '@everynews/schema/subscription'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await whoami()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch user's subscribed alerts with story counts
  const userAlerts = await db
    .select({
      alert: alerts,
      storyCount: sql<number>`count(distinct ${stories.id})`,
    })
    .from(subscriptions)
    .innerJoin(
      alerts,
      and(eq(subscriptions.alertId, alerts.id), isNull(alerts.deletedAt)),
    )
    .leftJoin(
      stories,
      and(eq(stories.alertId, alerts.id), isNull(stories.deletedAt)),
    )
    .where(
      and(eq(subscriptions.userId, user.id), isNull(subscriptions.deletedAt)),
    )
    .groupBy(alerts.id)
    .orderBy(desc(alerts.updatedAt))

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-6'>Home</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left sidebar - Alert list */}
        <div className='lg:col-span-1'>
          <div className='sticky top-4'>
            <h2 className='text-lg font-semibold mb-3'>Your Alerts</h2>

            <div className='space-y-2'>
              {/* All Alerts option */}
              <SidebarLinkWithBadge
                exact
                href='/home'
                title='All Alerts'
                description='View all triggered stories'
              />

              {/* Individual alerts */}
              {userAlerts.map(({ alert: alertItem, storyCount }) => (
                <SidebarLinkWithBadge
                  key={alertItem.id}
                  href={`/home/${alertItem.id}`}
                  title={alertItem.name}
                  description={alertItem.description || undefined}
                  badge={Number(storyCount)}
                />
              ))}

              {userAlerts.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  <FileText className='size-12 mx-auto mb-3 opacity-50' />
                  <p>No alerts subscribed yet</p>
                  <Link
                    href='/marketplace'
                    className='text-primary hover:underline text-sm mt-2 inline-block'
                  >
                    Browse alerts
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right content - Children */}
        <div className='lg:col-span-2'>{children}</div>
      </div>
    </div>
  )
}
