'use client'

import { cn } from '@everynews/lib/utils'
import { useEffect, useState } from 'react'

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div
      className={cn('bg-accent animate-pulse rounded-md', className)}
      style={isClient ? { animationDelay: `${Math.random() * 2}s` } : undefined}
      {...props}
    />
  )
}

export { Skeleton }
