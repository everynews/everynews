'use client'

import { cn } from '@everynews/lib/utils'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  className?: string
  actions?: ReactNode
}

export const PageHeader = ({ title, className, actions }: PageHeaderProps) => {
  return (
    <div
      className={cn(
        'flex justify-between gap-4 p-4 border-b',
        className,
      )}
    >
      <div className='space-y-1.5'>
        <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
      </div>
      {actions && <div className='flex items-center gap-2'>{actions}</div>}
    </div>
  )
}
