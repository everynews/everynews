import { getUser } from '@everynews/auth/session'
import { NavUser } from '@everynews/components/auth/nav-user'
import { Button } from '@everynews/components/ui/button'
import { Logo } from '@everynews/public/logo'
import Link from 'next/link'
import { Suspense } from 'react'
import { MainNavigation } from './main-navigation'
import { MobileNav } from './mobile-nav'

export const AppNavbar = async () => {
  const user = await getUser()

  return (
    <div className='mx-auto container flex items-center justify-between gap-6 p-4 md:gap-10'>
      <div className='flex items-center gap-6'>
        <Link href='/' className='flex items-center gap-2'>
          <Logo />
          <span className='inline-block font-bold'>Everynews</span>
          <span className='inline-block rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'>
            beta
          </span>
        </Link>
        <div className='hidden md:block'>
          <MainNavigation user={user} />
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <div className='md:hidden'>
          <MobileNav user={user} />
        </div>
        <Suspense
          fallback={
            <div className='h-8 w-8 animate-pulse rounded-full bg-muted' />
          }
        >
          {user ? (
            <NavUser user={user} />
          ) : (
            <div className='flex items-center gap-2'>
              <Button asChild size='sm' variant='outline'>
                <Link href='/sign-in'>Sign In</Link>
              </Button>
              <Button asChild size='sm'>
                <Link href='/sign-up'>Sign Up</Link>
              </Button>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
