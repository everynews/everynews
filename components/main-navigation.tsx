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
        {user && (
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link href='/home'>Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href='/marketplace'>Alert Marketplace</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
