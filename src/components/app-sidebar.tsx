import { AppSidebarContent } from '@everynews/components/app-sidebar-content'
import { AppSidebarLoading } from '@everynews/components/app-sidebar-loading'
import { AppSidebarTrigger } from '@everynews/components/app-sidebar-trigger'
import { NavUser } from '@everynews/components/nav-user'
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
} from '@everynews/components/ui/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense, type ComponentProps } from 'react'

export const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => (
  <Sidebar
    variant="inset"
    {...props}
    className="dark scheme-only-dark max-lg:p-3 lg:pe-1"
  >
    <SidebarHeader>
      <div className="flex items-center justify-between gap-2">
        <Link className="inline-flex items-center gap-1" href="/">
          <Image src="/logo.png" alt="Everynews Logo" width="32" height="32" />
          <span className="text-2xl font-bold tracking-tighter">Everynews</span>
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
