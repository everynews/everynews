'use client'

import { auth } from '~/auth'
import { NavUserLoading } from './loading'
import { SidebarMenu, SidebarMenuItem } from '~/components/ui/sidebar'
import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import { SidebarMenuButton } from '~/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  RiExpandUpDownLine,
  RiGroupLine,
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiSparklingLine,
  RiUserLine,
} from '@remixicon/react'
import SignIn from '../sign-in'

export const NavUser = () => {
  const session = auth.useSession()

  if (session.isPending) {
    return <NavUserLoading />
  }
  
  if (!session.data) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Dialog>
            <DialogTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg]:size-5"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="rounded-lg">?</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sign In</span>
                </div>
                <RiLoginCircleLine className="text-muted-foreground/80 ml-auto size-5" />
              </SidebarMenuButton>
            </DialogTrigger>
            <DialogContent>
              <SignIn />
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg]:size-5"
            >
              <Avatar className="size-8">
                <AvatarImage
                  src={session.data?.user.image || ''}
                  alt={session.data?.user.name || ''}
                />
                <AvatarFallback className="rounded-lg">
                  {session.data?.user.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {session.data?.user.name || session.data?.user.email}
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
}
