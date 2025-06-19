import { whoami } from '@everynews/auth/session'
import { SidebarLinkWithBadge } from '@everynews/components/sidebar-link-with-badge'
import { Button } from '@everynews/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@everynews/components/ui/sheet'
import { db } from '@everynews/database'
import { alerts } from '@everynews/schema/alert'
import { channels } from '@everynews/schema/channel'
import { prompt } from '@everynews/schema/prompt'
import { subscriptions } from '@everynews/schema/subscription'
import { and, count, eq, isNull } from 'drizzle-orm'
import { Menu } from 'lucide-react'
import Link from 'next/link'

type SidebarItem = {
  href: string
  title: string
  count?: number
}

const MobileSidebar = ({ items }: { items: SidebarItem[] }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='ghost' size='icon' className='md:hidden'>
        <Menu className='size-4' />
        <span className='sr-only'>Open menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side='left'>
      <nav className='flex flex-col gap-2 p-4'>
        {items.map((item) => (
          <SheetClose asChild key={item.href}>
            <Link
              href={item.href}
              className='flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground'
            >
              <span>{item.title}</span>
              {item.count !== undefined && (
                <span className='text-xs text-muted-foreground'>
                  {item.count}
                </span>
              )}
            </Link>
          </SheetClose>
        ))}
      </nav>
    </SheetContent>
  </Sheet>
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
            .where(
              and(
                eq(subscriptions.userId, user.id),
                isNull(subscriptions.deletedAt),
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
