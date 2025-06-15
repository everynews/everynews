'use client'

import { Button } from '@everynews/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@everynews/components/ui/sheet'
import { cn } from '@everynews/lib/utils'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sidebarItems = [
  {
    href: '/my/alerts',
    title: 'Alerts',
  },
  {
    href: '/my/prompts',
    title: 'Prompts',
  },
  {
    href: '/my/channels',
    title: 'Channels',
  },
  {
    href: '/my/subscriptions',
    title: 'Subscriptions',
  },
]

const MobileSidebar = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='ghost' size='icon' className='md:hidden'>
        <Menu className='size-4' />
        <span className='sr-only'>Open menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side='left'>
      <nav className='flex flex-col gap-2 p-4'>
        {sidebarItems.map((item) => (
          <SheetClose asChild key={item.href}>
            <Link
              href={item.href}
              className='text-sm font-medium text-muted-foreground hover:text-foreground'
            >
              {item.title}
            </Link>
          </SheetClose>
        ))}
      </nav>
    </SheetContent>
  </Sheet>
)

const MyLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex'>
      <aside className='hidden w-64 shrink-0 bg-background/50 p-6 md:block'>
        <nav className='flex flex-col gap-2'>
          {sidebarItems.map((item) => (
            <SidebarLink key={item.href} href={item.href} title={item.title} />
          ))}
        </nav>
      </aside>
      <div className='flex-1'>
        <div className='p-4 md:hidden'>
          <MobileSidebar />
        </div>
        <main className='py-6'>{children}</main>
      </div>
    </div>
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
