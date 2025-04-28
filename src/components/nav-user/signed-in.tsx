import { auth } from '@everynews/auth/client'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@everynews/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@everynews/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@everynews/components/ui/sidebar'
import {
  AccountsIcon,
  LogoutIcon,
  MenuExpandIcon,
  ProfileIcon,
  SparkleIcon,
} from '@everynews/icons'
import type { User } from 'better-auth'
import { redirect } from 'next/navigation'

export const NavUserSignedIn = (user: User) => (
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild data-slot="sidebar-menu-button">
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg] size-5"
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
            <MenuExpandIcon className="text-muted-foreground/80 ml-auto" />
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
              <ProfileIcon className="text-muted-foreground/80 size-5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-sidebar-accent gap-3">
              <AccountsIcon className="text-muted-foreground/80" />
              Accounts
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-sidebar-accent gap-3">
              <SparkleIcon className="text-muted-foreground/80" />
              Upgrade
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-sidebar-accent gap-3"
              onClick={async () => {
                await auth.signOut()
                redirect('/')
              }}
            >
              <LogoutIcon className="text-muted-foreground/80" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
)
