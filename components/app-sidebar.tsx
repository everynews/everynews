'use client'

import { Divider } from '@everynews/components/ui/divider'
import { Input } from '@everynews/components/ui/input'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarLink,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSubLink,
} from '@everynews/components/ui/sidebar'
import { UserProfile } from '@everynews/components/user-profile'
import { cx, focusRing } from '@everynews/lib/utils'
import { RiArrowDownSFill } from '@remixicon/react'
import { BookText, House, PackageSearch } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

const navigation = [
  {
    active: false,
    href: '#',
    icon: House,
    name: 'Home',
    notifications: false,
  },
  {
    active: false,
    href: '#',
    icon: PackageSearch,
    name: 'My Alerts',
    notifications: 2,
  },
] as const

const navigation2 = [
  {
    children: [
      {
        active: true,
        href: '#',
        name: 'Alerts 1',
      },
      {
        active: false,
        href: '#',
        name: 'Alerts 2',
      },
      {
        active: false,
        href: '#',
        name: 'Alerts 3',
      },
    ],
    href: '#',
    icon: BookText,
    name: 'Alerts',
  },
  {
    children: [
      {
        active: false,
        href: '#',
        name: 'Alerts 4',
      },
      {
        active: false,
        href: '#',
        name: 'Alerts 5',
      },
    ],
    href: '#',
    icon: PackageSearch,
    name: 'Notifications',
  },
] as const

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [openMenus, setOpenMenus] = React.useState<string[]>([
    navigation2[0].name,
    navigation2[1].name,
  ])
  const toggleMenu = (name: string) => {
    setOpenMenus((prev: string[]) =>
      prev.includes(name)
        ? prev.filter((item: string) => item !== name)
        : [...prev, name],
    )
  }
  return (
    <Sidebar {...props} className='dark:bg-gray-925 bg-gray-50'>
      <SidebarHeader className='px-3 py-4'>
        <div className='flex items-center gap-3'>
          <span className='flex size-9 items-center justify-center rounded-md bg-white p-1.5 shadow-xs ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800'>
            <Image
              src='/logo.png'
              className='size-6 text-blue-500 dark:text-blue-500'
              alt='Logo'
              width={24}
              height={24}
            />
          </span>
          <div>
            <span className='block text-sm font-semibold text-gray-900 dark:text-gray-50'>
              Everynews
            </span>
            <span className='block text-xs text-gray-500 dark:text-gray-400'>
              Alerts like it's 2025
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Input
              type='search'
              placeholder='Search items...'
              className='sm:[&>input]:py-1.5'
            />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className='pt-0'>
          <SidebarGroupContent>
            <SidebarMenu className='space-y-1'>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarLink
                    href='#'
                    isActive={item.active}
                    icon={item.icon}
                    notifications={item.notifications}
                  >
                    {item.name}
                  </SidebarLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className='px-3'>
          <Divider className='my-0 py-0' />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className='space-y-4'>
              {navigation2.map((item) => (
                <SidebarMenuItem key={item.name}>
                  {/* @CHRIS/SEV: discussion whether to componentize (-> state mgmt) */}
                  <button
                    type='button'
                    onClick={() => toggleMenu(item.name)}
                    className={cx(
                      'flex w-full items-center justify-between gap-x-2.5 rounded-md p-2 text-base text-gray-900 transition hover:bg-gray-200/50 sm:text-sm dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-50',
                      focusRing,
                    )}
                  >
                    <div className='flex items-center gap-2.5'>
                      <item.icon
                        className='size-[18px] shrink-0'
                        aria-hidden='true'
                      />
                      {item.name}
                    </div>
                    <RiArrowDownSFill
                      className={cx(
                        openMenus.includes(item.name)
                          ? 'rotate-0'
                          : '-rotate-90',
                        'size-5 shrink-0 transform text-gray-400 transition-transform duration-150 ease-in-out dark:text-gray-600',
                      )}
                      aria-hidden='true'
                    />
                  </button>
                  {item.children && openMenus.includes(item.name) && (
                    <SidebarMenuSub>
                      <div className='absolute inset-y-0 left-4 w-px bg-gray-300 dark:bg-gray-800' />
                      {item.children.map((child) => (
                        <SidebarMenuItem key={child.name}>
                          <SidebarSubLink
                            href={child.href}
                            isActive={child.active}
                          >
                            {child.name}
                          </SidebarSubLink>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className='border-t border-gray-200 dark:border-gray-800' />
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
}
