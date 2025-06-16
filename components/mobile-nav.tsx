'use client'

import { NavUser } from '@everynews/components/auth/nav-user'
import { ThemeToggle } from '@everynews/components/theme/toggle'
import { Button } from '@everynews/components/ui/button'
import { Separator } from '@everynews/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTrigger,
} from '@everynews/components/ui/sheet'
import { Logo } from '@everynews/public/logo'
import type { User } from 'better-auth'
import Link from 'next/link'

export const MobileNav = ({ user }: { user?: User | null }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='ghost' size='sm' className='md:hidden'>
        Menu
      </Button>
    </SheetTrigger>
    <SheetContent side='left' className='flex flex-col'>
      <SheetHeader>
        <SheetClose asChild>
          <Link href='/' className='flex items-center gap-2'>
            <Logo />
            <span className='font-bold'>Everynews</span>
            <span className='rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'>
              open beta
            </span>
          </Link>
        </SheetClose>
      </SheetHeader>
      <nav className='flex flex-col gap-4 p-4 flex-1 overflow-y-auto'>
        <SheetClose asChild>
          <Link
            href={user ? '/home' : '/'}
            className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
          >
            Home
          </Link>
        </SheetClose>

        <Separator />

        <div className='flex flex-col gap-1'>
          <p className='px-3 text-xs font-semibold text-muted-foreground'>
            Alerts
          </p>
          <SheetClose asChild>
            <Link
              href='/alerts'
              className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
            >
              Public Alerts
            </Link>
          </SheetClose>
          {user && (
            <>
              <SheetClose asChild>
                <Link
                  href='/my/alerts'
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                >
                  My Alerts
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href='/my/alerts/create'
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                >
                  Create Alert
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href='/my/subscriptions'
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                >
                  My Subscriptions
                </Link>
              </SheetClose>
            </>
          )}
        </div>

        {user && (
          <>
            <Separator />

            <div className='flex flex-col gap-1'>
              <p className='px-3 text-xs font-semibold text-muted-foreground'>
                My Workspace
              </p>
              <SheetClose asChild>
                <Link
                  href='/my'
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                >
                  Dashboard
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href='/my/channels'
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                >
                  Channels
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href='/my/prompts'
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                >
                  Prompts
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href='/my/alerts'
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
                >
                  Alerts
                </Link>
              </SheetClose>
            </div>

            <Separator />

            <SheetClose asChild>
              <Link
                href='/firefighter-mode'
                className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
              >
                Firefighter Mode
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href='/onboarding'
                className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent'
              >
                Get Started
              </Link>
            </SheetClose>
          </>
        )}
      </nav>
      <SheetFooter className='mt-auto flex-row items-center justify-between'>
        <ThemeToggle />
        {user ? (
          <NavUser user={user} />
        ) : (
          <Button asChild>
            <Link href='/sign-in'>Sign In</Link>
          </Button>
        )}
      </SheetFooter>
    </SheetContent>
  </Sheet>
)
