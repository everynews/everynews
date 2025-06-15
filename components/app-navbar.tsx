import { whoami } from '@everynews/auth/session'
import { NavUser } from '@everynews/components/auth/nav-user'
import { Button } from '@everynews/components/ui/button'
import { Logo } from '@everynews/public/logo'
import Link from 'next/link'
import { Suspense } from 'react'
import { MobileNav } from './mobile-nav'
import { ThemeToggle } from './theme/toggle'

export const AppNavbar = async () => {
  const user = await whoami()

  return (
    <div className='mx-auto container flex items-center justify-between gap-6 p-4 md:gap-10'>
      <Link href='/' className='flex items-center gap-2'>
        <Logo />
        <span className='inline-block font-bold'>Everynews</span>
        <span className='inline-block rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
          beta
        </span>
      </Link>
      <MobileNav user={user} />
      <div className='hidden items-center gap-2 md:flex'>
        <nav className='flex gap-6'>
          <Link
            href='/alerts'
            className='flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            Alerts
          </Link>
        </nav>
        <ThemeToggle />
        <Suspense
          fallback={
            <div className='h-8 w-8 animate-pulse rounded-full bg-muted' />
          }
        >
          {user ? (
            <NavUser user={user} />
          ) : (
            <Button asChild>
              <Link href='/sign-in'>Sign In</Link>
            </Button>
          )}
        </Suspense>
      </div>
    </div>
  )
}
