'use client'

import { MobileSidebarLink } from '@everynews/components/mobile-sidebar-link'
import { MobileSidebarShell } from '@everynews/components/mobile-sidebar-shell'
import { ThemeToggle } from '@everynews/components/theme/toggle'
import { Separator } from '@everynews/components/ui/separator'
import {
  SheetClose,
  SheetFooter,
  SheetTitle,
} from '@everynews/components/ui/sheet'
import { Logo } from '@everynews/public/logo'
import type { User } from 'better-auth'
import Link from 'next/link'

export const MobileNav = ({ user }: { user?: User | null }) => {
  const header = (
    <>
      <SheetClose asChild>
        <Link href='/' className='flex items-center gap-2'>
          <Logo />
          <span className='font-bold'>Everynews</span>
          <span className='rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'>
            open beta
          </span>
        </Link>
      </SheetClose>
      <SheetTitle className='sr-only'>Navigation Menu</SheetTitle>
    </>
  )

  const footer = (
    <SheetFooter className='mt-auto'>
      <ThemeToggle />
    </SheetFooter>
  )

  return (
    <MobileSidebarShell header={header} footer={footer}>
      <MobileSidebarLink href={user ? '/home' : '/'}>Home</MobileSidebarLink>

      <Separator />

      <div className='flex flex-col gap-1'>
        <p className='px-4 text-xs font-semibold text-muted-foreground'>
          Alerts
        </p>
        <MobileSidebarLink href='/marketplace'>Marketplace</MobileSidebarLink>
        {user && (
          <>
            <MobileSidebarLink href='/my/alerts'>My Alerts</MobileSidebarLink>
            <MobileSidebarLink href='/my/alerts/create'>
              Create Alert
            </MobileSidebarLink>
            <MobileSidebarLink href='/my/subscriptions'>
              My Subscriptions
            </MobileSidebarLink>
          </>
        )}
      </div>

      {user && (
        <>
          <Separator />

          <div className='flex flex-col gap-1'>
            <p className='px-4 text-xs font-semibold text-muted-foreground'>
              My Workspace
            </p>
            <MobileSidebarLink href='/my'>Dashboard</MobileSidebarLink>
            <MobileSidebarLink href='/my/channels'>Channels</MobileSidebarLink>
            <MobileSidebarLink href='/my/prompts'>Prompts</MobileSidebarLink>
            <MobileSidebarLink href='/my/alerts'>Alerts</MobileSidebarLink>
          </div>

          <Separator />

          <MobileSidebarLink href='/firefighter-mode'>
            Firefighter Mode
          </MobileSidebarLink>
          <MobileSidebarLink href='/onboarding'>Get Started</MobileSidebarLink>
        </>
      )}
    </MobileSidebarShell>
  )
}
