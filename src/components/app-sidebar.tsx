import Link from 'next/link'
import { Suspense, type ComponentProps } from 'react'
import { AppSidebarContent } from '~/components/app-sidebar-content'
import { AppSidebarLoading } from '~/components/app-sidebar-loading'
import { AppSidebarTrigger } from '~/components/app-sidebar-trigger'
import { NavUser } from '~/components/nav-user'
import { Sidebar, SidebarFooter, SidebarHeader } from '~/components/ui/sidebar'
import Image from 'next/image'

export const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => (
  <Sidebar
    variant="inset"
    {...props}
    className="dark scheme-only-dark max-lg:p-3 lg:pe-1"
  >
    <SidebarHeader>
      <div className="flex items-center justify-between gap-2">
        <Link className="inline-flex items-center gap-2" href="/">
          <Image src="/logo.png" alt="Everynews Logo" width="32" height="32" />
          <span className="text-lg font-bold">Everynews</span>
        </Link>
        <AppSidebarTrigger />
      </div>
    </SidebarHeader>
    <Suspense fallback={<AppSidebarLoading />}>
      <AppSidebarContent />
    </Suspense>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
  </Sidebar>
)
