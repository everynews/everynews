'use client'

import { cn } from '@everynews/lib/utils'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import type * as React from 'react'

export const Avatar = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    data-slot='avatar'
    className={cn(
      'relative flex size-8 shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
)

export const AvatarImage = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image
    data-slot='avatar-image'
    className={cn('aspect-square size-full', className)}
    {...props}
  />
)

export const AvatarFallback = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    data-slot='avatar-fallback'
    className={cn(
      'bg-muted flex size-full items-center justify-center rounded-full',
      className,
    )}
    {...props}
  />
)
