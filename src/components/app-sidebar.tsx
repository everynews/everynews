import Link from 'next/link'
import { Suspense, type ComponentProps } from 'react'
import { AppSidebarContent } from '~/components/app-sidebar-content'
import { AppSidebarLoading } from '~/components/app-sidebar-loading'
import { AppSidebarTrigger } from '~/components/app-sidebar-trigger'
import { NavUser } from '~/components/nav-user'
import { Sidebar, SidebarFooter, SidebarHeader } from '~/components/ui/sidebar'

export const AppSidebar = ({ ...props }: ComponentProps<typeof Sidebar>) => (
  <Sidebar
    variant="inset"
    {...props}
    className="dark scheme-only-dark max-lg:p-3 lg:pe-1"
  >
    <SidebarHeader>
      <div className="flex items-center justify-between gap-2">
        <Link className="inline-flex" href="/">
          <span className="sr-only">Logo</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
          >
            <title>Logo</title>
            <path
              fill="#52525C"
              d="m10.661.863-2.339 1.04 5.251 11.794L1.521 9.072l-.918 2.39 12.053 4.627-11.794 5.25 1.041 2.34 11.794-5.252L9.071 30.48l2.39.917 4.626-12.052 5.251 11.793 2.339-1.04-5.251-11.795 12.052 4.627.917-2.39-12.052-4.627 11.794-5.25-1.041-2.34-11.794 5.252L22.928 1.52l-2.39-.917-4.626 12.052L10.662.863Z"
            />
            <path
              fill="#F4F4F5"
              d="M17.28 0h-2.56v12.91L5.591 3.78l-1.81 1.81 9.129 9.129H0v2.56h12.91L3.78 26.409l1.81 1.81 9.129-9.129V32h2.56V19.09l9.128 9.129 1.81-1.81-9.128-9.129H32v-2.56H19.09l9.129-9.129-1.81-1.81-9.129 9.129V0Z"
            />
          </svg>
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
