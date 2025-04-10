'use client'

import * as AvatarPrimitive from '@radix-ui/react-avatar'
import type { ComponentProps } from 'react'
import { cn } from '~/lib/cn'

const Avatar = ({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Root>) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    className={cn(
      'relative flex size-8 shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
)

const AvatarImage = ({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) => (
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn('aspect-square size-full', className)}
    {...props}
  />
)

const AvatarFallback = ({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn(
      'bg-muted flex size-full items-center justify-center rounded-full',
      className,
    )}
    {...props}
  />
)

export { Avatar, AvatarImage, AvatarFallback }
