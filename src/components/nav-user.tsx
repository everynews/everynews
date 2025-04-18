import {
  RiExpandUpDownLine,
  RiGroupLine,
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiSparklingLine,
  RiUserLine,
} from '@remixicon/react'
import { authClient, signOut } from '~/auth/client'
import SignIn from '~/components/sign-in'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Dialog, DialogTrigger } from '~/components/ui/dialog'
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

export const NavUser = async () => {
  const { data: session } = await authClient.getSession()

  if (!session) {
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
            <SignIn />
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
                  src={session.user?.image || ''}
                  alt={session.user?.name || ''}
                />
                <AvatarFallback className="rounded-lg">
                  {session.user?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {session.user?.name || session.user?.email}
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
                onClick={() => signOut()}
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
