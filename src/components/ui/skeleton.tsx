import type { ComponentProps } from 'react'
import { cn } from '~/lib/utils'

const Skeleton = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="skeleton"
    className={cn('bg-accent animate-pulse rounded-md', className)}
    {...props}
  />
)

export { Skeleton }
