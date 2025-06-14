import { whoami } from '@everynews/auth/session'
import { NavUser } from '@everynews/components/auth/nav-user'
import { SignIn } from '@everynews/components/auth/sign-in'
import { Logo } from '@everynews/public/logo'
import Link from 'next/link'
import { Suspense } from 'react'
import { ThemeToggle } from './theme/toggle'

export const AppNavbar = async () => {
  const user = await whoami()

  return (
    <div className='flex gap-6 md:gap-10 mx-auto container p-4 justify-between items-center'>
      <div className='flex gap-6'>
        <Link href='/' className='flex items-center gap-2'>
          <Logo />
          <span className='inline-block font-bold'>Everynews</span>
          <span className='inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md'>
            beta
          </span>
        </Link>
        <nav className='flex gap-6'>
          <Link
            href='/newsletters'
            className='flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
          >
            Newsletters
          </Link>
        </nav>
      </div>
      <div className='flex items-center gap-2'>
        <ThemeToggle />
        <Suspense
          fallback={
            <div className='h-8 w-8 animate-pulse rounded-full bg-muted' />
          }
        >
          {user ? <NavUser user={user} /> : <SignIn />}
        </Suspense>
      </div>
    </div>
  )
}
