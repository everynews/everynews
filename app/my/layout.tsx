'use client'

import { cn } from '@everynews/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sidebarItems = [
  {
    href: '/my/newsletters',
    title: 'Newsletters',
  },
  {
    href: '/my/channels',
    title: 'Channels',
  },
]

const MyLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className='flex'>
        <aside className='w-64 bg-background/50 p-6'>
          <nav className='space-y-2'>
            {sidebarItems.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                title={item.title}
              />
            ))}
          </nav>
        </aside>
        <main className='flex-1 py-6'>{children}</main>
      </div>
    </>
  )
}

const SidebarLink = ({ href, title }: { href: string; title: string }) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
      )}
    >
      {title}
    </Link>
  )
}

export default MyLayout
