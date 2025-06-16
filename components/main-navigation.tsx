'use client'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@everynews/components/ui/navigation-menu'
import type { User } from 'better-auth'
import Link from 'next/link'
import type * as React from 'react'

export const MainNavigation = ({ user }: { user?: User | null }) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Home - Always visible */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={user ? '/home' : '/'}>Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href='/alerts'>Alert Marketplace</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        {!user && (
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link href='/firefighter-mode'>Firefighter Mode</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        {!user && (
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link href='/onboarding'>Get Started</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = ({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & {
  href: string
}) => {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
        >
          <div className='text-sm font-medium leading-none'>{title}</div>
          <p className='line-clamp-2 text-sm leading-snug text-muted-foreground'>
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
