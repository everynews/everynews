'use client'

import { cn } from '@everynews/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const SidebarLinkWithBadge = ({
  href,
  title,
  description,
  badge,
  exact,
}: {
  href: string
  title: string
  description?: string
  badge?: string | number
  exact?: boolean
}) => {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'block p-3 rounded-md transition-colors',
        isActive ? 'bg-muted' : 'hover:bg-accent border-border',
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='font-medium'>{title}</div>
        {badge !== undefined && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
              isActive
                ? 'text-primary-foreground bg-primary'
                : 'text-muted-foreground',
            )}
          >
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className='text-sm mt-1 opacity-80 line-clamp-2'>{description}</p>
      )}
    </Link>
  )
}
