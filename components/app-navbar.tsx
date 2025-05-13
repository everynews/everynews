import { whoami } from '@everynews/auth/session'
import { NavUser } from '@everynews/components/auth/nav-user'
import { Button } from '@everynews/components/ui/button'
import { Logo } from '@everynews/logo'
import Link from 'next/link'
import { Suspense } from 'react'

export const AppNavbar = async () => {
  const user = await whoami()

  return (
    <div className='flex gap-6 md:gap-10 mx-auto container p-4'>
      <Link href='/' className='flex items-center space-x-2'>
        <Logo />
        <span className='inline-block font-bold'>Everynews</span>
      </Link>
      <nav className='flex gap-6'>
        <Link
          href='/news'
          className='flex items-center text-sm font-medium text-muted-foreground'
        >
          News
        </Link>
      </nav>
      <div className='ml-auto flex items-center space-x-4'>
        <Suspense
          fallback={
            <div className='h-8 w-8 animate-pulse rounded-full bg-muted' />
          }
        >
          {user ? (
            <NavUser user={user} />
          ) : (
            <Button variant='outline'>Sign In</Button>
          )}
        </Suspense>
      </div>
    </div>
  )
}
