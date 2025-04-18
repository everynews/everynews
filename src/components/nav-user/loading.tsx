import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'

export const NavUserLoading = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg]:size-5"
      >
        <Avatar className="size-8">
          <AvatarFallback className="animate-pulse rounded-lg">
            ...
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="animate-pulse truncate font-medium">Loading...</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
)
