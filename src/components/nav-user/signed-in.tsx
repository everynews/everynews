'use client'

import {
  RiExpandUpDownLine,
  RiGroupLine,
  RiLogoutCircleLine,
  RiSparklingLine,
  RiUserLine,
} from '@remixicon/react'
import type { User } from 'better-auth'
import { auth } from '~/auth/client'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'

export const NavUserSignedIn = (user: User) => (
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild data-slot="sidebar-menu-button">
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg]:size-5"
            type="button"
          >
            <Avatar className="size-8">
              <AvatarImage src={user.image || ''} alt={user.name || ''} />
              <AvatarFallback className="rounded-lg">
                {user.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user.name || user.email || 'User'}
              </span>
            </div>
            <RiExpandUpDownLine className="text-muted-foreground/80 ml-auto size-5" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="dark bg-sidebar w-(--radix-dropdown-menu-trigger-width)"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem className="focus:bg-sidebar-accent gap-3">
              <RiUserLine
                size={20}
                className="text-muted-foreground/80 size-5"
              />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-sidebar-accent gap-3">
              <RiGroupLine
                size={20}
                className="text-muted-foreground/80 size-5"
              />
              Accounts
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-sidebar-accent gap-3">
              <RiSparklingLine
                size={20}
                className="text-muted-foreground/80 size-5"
              />
              Upgrade
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-sidebar-accent gap-3"
              onClick={() => auth.signOut()}
            >
              <RiLogoutCircleLine
                size={20}
                className="text-muted-foreground/80 size-5"
              />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
)
