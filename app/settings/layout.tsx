import { MobileSidebarLink } from '@everynews/components/mobile-sidebar-link'
import { MobileSidebarShell } from '@everynews/components/mobile-sidebar-shell'
import { SidebarLinkWithBadge } from '@everynews/components/sidebar-link-with-badge'

type SidebarItem = {
  href: string
  title: string
}

const MobileSidebar = ({ items }: { items: SidebarItem[] }) => (
  <MobileSidebarShell title='Settings'>
    {items.map((item) => (
      <MobileSidebarLink key={item.href} href={item.href}>
        {item.title}
      </MobileSidebarLink>
    ))}
  </MobileSidebarShell>
)

const SettingsLayout = async ({ children }: { children: React.ReactNode }) => {
  const sidebarItems: SidebarItem[] = [
    {
      href: '/settings',
      title: 'Profile',
    },
    {
      href: '/settings/accounts',
      title: 'Connected Accounts',
    },
    {
      href: '/settings/sessions',
      title: 'Active Sessions',
    },
    {
      href: '/settings/danger',
      title: 'Danger Zone',
    },
  ]

  return (
    <div className='flex'>
      <aside className='hidden w-64 shrink-0 bg-background/50 p-6 md:block'>
        <nav className='flex flex-col gap-2'>
          {sidebarItems.map((item) => (
            <SidebarLinkWithBadge
              key={item.href}
              href={item.href}
              title={item.title}
            />
          ))}
        </nav>
      </aside>
      <div className='flex-1'>
        <div className='p-4 md:hidden'>
          <MobileSidebar items={sidebarItems} />
        </div>
        <main className='px-4 py-4 sm:px-6 sm:py-6'>{children}</main>
      </div>
    </div>
  )
}

export default SettingsLayout
