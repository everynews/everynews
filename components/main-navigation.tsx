'use client'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@everynews/components/ui/navigation-menu'
import type { User } from 'better-auth'
import Link from 'next/link'

export const MainNavigation = ({ user }: { user?: User | null }) => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
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
