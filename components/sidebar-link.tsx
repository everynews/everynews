'use client'

import { cn } from '@everynews/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const SidebarLink = ({
  href,
  title,
}: {
  href: string
  title: string
}) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
      )}
    >
      {title}
    </Link>
  )
}
