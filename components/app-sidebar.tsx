import { whoami } from '@everynews/auth/session'
import { NavUser } from '@everynews/components/auth/nav-user'
import { SignIn } from '@everynews/components/auth/sign-in'
import { SidebarNavItem } from '@everynews/components/sidebar-nav-item'
import { Button } from '@everynews/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from '@everynews/components/ui/sidebar'
import { Newspaper } from 'lucide-react'
import { Suspense } from 'react'

export const AppSidebar = async () => {
  const user = await whoami()

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <div className='space-y-1 px-3 py-2'>
            <SidebarNavItem href='/news' icon={<Newspaper size={16} />}>
              News
            </SidebarNavItem>
          </div>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <Suspense
          fallback={
            <Button variant='outline' size='sm' className='w-full' disabled>
              Loading...
            </Button>
          }
        >
          {!user ? <SignIn /> : <NavUser user={user} />}
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  )
}
