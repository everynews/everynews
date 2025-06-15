'use client'

import { NavUser } from '@everynews/components/auth/nav-user'
import { ThemeToggle } from '@everynews/components/theme/toggle'
import { Button } from '@everynews/components/ui/button'
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
import { Menu } from 'lucide-react'
import Link from 'next/link'

export const MobileNav = ({ user }: { user?: User | null }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='ghost' size='icon' className='md:hidden'>
        <Menu className='size-4' />
        <span className='sr-only'>Open menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side='left' className='flex flex-col'>
      <SheetHeader>
        <SheetClose asChild>
          <Link href='/' className='flex items-center gap-2'>
            <Logo />
            <span className='font-bold'>Everynews</span>
            <span className='rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
              beta
            </span>
          </Link>
        </SheetClose>
      </SheetHeader>
      <nav className='flex flex-col gap-4 p-4'>
        <SheetClose asChild>
          <Link
            href='/alerts'
            className='flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            Alerts
          </Link>
        </SheetClose>
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
