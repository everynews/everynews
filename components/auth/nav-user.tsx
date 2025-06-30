'use client'
import { DropdownSignOut } from '@everynews/components/auth/sign-out'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@everynews/components/ui/avatar'
import { Button } from '@everynews/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@everynews/components/ui/dropdown-menu'
import type { User } from 'better-auth'
import { UserIcon } from 'lucide-react'
import Link from 'next/link'

export const NavUser = ({ user }: { user: User }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-10 w-10 rounded-full p-0'>
          <span className='sr-only'>Open user menu</span>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>
              <UserIcon className='h-4 w-4' />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='p-0 font-normal'>
          <div className='flex items-center gap-2 p-2 text-left text-sm'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>
                <UserIcon className='h-4 w-4' />
              </AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate text-sm font-semibold'>
                {user.name || 'User'}
              </span>
              <span className='truncate text-xs text-muted-foreground'>
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/my/alerts' className='cursor-pointer'>
              <span>My Alerts</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/my/channels' className='cursor-pointer'>
              <span>My Channels</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/my/subscriptions' className='cursor-pointer'>
              <span>My Subscriptions</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/settings' className='cursor-pointer'>
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownSignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
