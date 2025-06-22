import { whoami } from '@everynews/auth/session'
import { MobileSidebarLink } from '@everynews/components/mobile-sidebar-link'
import { MobileSidebarShell } from '@everynews/components/mobile-sidebar-shell'
import { SidebarLinkWithBadge } from '@everynews/components/sidebar-link-with-badge'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { channels } from '@everynews/schema/channel'
import { prompt } from '@everynews/schema/prompt'
import { subscriptions } from '@everynews/schema/subscription'
import { and, count, eq, isNull } from 'drizzle-orm'

type SidebarItem = {
  href: string
  title: string
  count?: number
}

const MobileSidebar = ({ items }: { items: SidebarItem[] }) => (
  <MobileSidebarShell title='My Workspace'>
    {items.map((item) => (
      <MobileSidebarLink key={item.href} href={item.href} badge={item.count}>
        {item.title}
      </MobileSidebarLink>
    ))}
  </MobileSidebarShell>
)

const MyLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await whoami()

  // Fetch counts for each section
  const [alertCount, promptCount, channelCount, subscriptionCount] =
    await Promise.all([
      user
        ? db
            .select({ count: count() })
            .from(alerts)
            .where(and(eq(alerts.userId, user.id), isNull(alerts.deletedAt)))
            .then((r) => r[0]?.count ?? 0)
        : 0,
      user
        ? db
            .select({ count: count() })
            .from(prompt)
            .where(and(eq(prompt.userId, user.id), isNull(prompt.deletedAt)))
            .then((r) => r[0]?.count ?? 0)
        : 0,
      user
        ? db
            .select({ count: count() })
            .from(channels)
            .where(
              and(eq(channels.userId, user.id), isNull(channels.deletedAt)),
            )
            .then((r) => r[0]?.count ?? 0)
        : 0,
      user
        ? db
            .select({ count: count() })
            .from(subscriptions)
            .innerJoin(alerts, eq(subscriptions.alertId, alerts.id))
            .where(
              and(
                eq(subscriptions.userId, user.id),
                isNull(subscriptions.deletedAt),
                isNull(alerts.deletedAt),
              ),
            )
            .then((r) => r[0]?.count ?? 0)
        : 0,
    ])

  const sidebarItems: SidebarItem[] = [
    {
      count: alertCount,
      href: '/my/alerts',
      title: 'Alerts',
    },
    {
      count: promptCount,
      href: '/my/prompts',
      title: 'Prompts',
    },
    {
      count: channelCount,
      href: '/my/channels',
      title: 'Channels',
    },
    {
      count: subscriptionCount,
      href: '/my/subscriptions',
      title: 'Subscriptions',
    },
  ]

  return (
    <div className='flex'>
      <aside className='hidden w-64 shrink-0 bg-background/50 p-6 md:block'>
        <nav className='flex flex-col gap-2'>
          {sidebarItems.map((item) => (
            <SidebarLinkWithBadge
              key={item.href}
              href={item.href}
              title={item.title}
              badge={item.count}
            />
          ))}
        </nav>
      </aside>
      <div className='flex-1'>
        <div className='p-4 md:hidden'>
          <MobileSidebar items={sidebarItems} />
        </div>
        <main className='py-6'>{children}</main>
      </div>
    </div>
  )
}

export default MyLayout
