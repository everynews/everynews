'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface SidebarNavItemProps {
  href: string
  children: ReactNode
  icon?: ReactNode
  exact?: boolean
}

export const SidebarNavItem = ({
  href,
  children,
  icon,
  exact = false,
}: SidebarNavItemProps) => {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-secondary',
        isActive
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon && <span className='text-muted-foreground'>{icon}</span>}
      <span>{children}</span>
    </Link>
  )
}
