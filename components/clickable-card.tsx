'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface ClickableCardProps {
  href: string
  lang?: string
  children: ReactNode
  actions?: ReactNode
}

export const ClickableCard = ({
  href,
  lang,
  children,
  actions,
}: ClickableCardProps) => {
  const handleActionsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleActionsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <Link href={href} lang={lang} className='block group'>
      <div className='relative border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer bg-card h-full'>
        {children}
        {actions && (
          <div
            onClick={handleActionsClick}
            onKeyDown={handleActionsKeyDown}
            className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity'
            role='toolbar'
            aria-label='Card actions'
          >
            {actions}
          </div>
        )}
      </div>
    </Link>
  )
}
