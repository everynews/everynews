import { cn } from '@everynews/lib/cn'
import type { ComponentProps } from 'react'

const Skeleton = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    className={cn('bg-accent animate-pulse rounded-md', className)}
    {...props}
  />
)

export { Skeleton }
