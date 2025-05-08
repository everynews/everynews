'use client'

import { SidebarTrigger } from '@everynews/components/ui/sidebar'
import { cn } from '@everynews/lib/utils'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  className?: string
  actions?: ReactNode
}

export const PageHeader = ({
  title,
  description,
  className,
  actions,
}: PageHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4',
        className,
      )}
    >
      <SidebarTrigger />
      <div className='space-y-1.5'>
        <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
        {description && <p className='text-muted-foreground'>{description}</p>}
      </div>
      {actions && <div className='flex items-center gap-2'>{actions}</div>}
    </div>
  )
}
