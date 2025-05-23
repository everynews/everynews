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
import { BadgeCheck, Bell, CreditCard, UserIcon } from 'lucide-react'

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
          <DropdownMenuItem>
            <BadgeCheck className='mr-2 h-4 w-4' />
            <span>Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className='mr-2 h-4 w-4' />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className='mr-2 h-4 w-4' />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownSignOut />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
