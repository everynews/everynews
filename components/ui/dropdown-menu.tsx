'use client'

import { cn } from '@everynews/lib/utils'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as React from 'react'

export const DropdownMenu = ({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) => (
  <DropdownMenuPrimitive.Root data-slot='dropdown-menu' {...props} />
)

export const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>((props, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    data-slot='dropdown-menu-trigger'
    {...props}
  />
))
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName

export const DropdownMenuContent = ({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      data-slot='dropdown-menu-content'
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem]  overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
)

export const DropdownMenuGroup = ({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) => (
  <DropdownMenuPrimitive.Group data-slot='dropdown-menu-group' {...props} />
)

export const DropdownMenuItem = ({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: 'default' | 'destructive'
}) => (
  <DropdownMenuPrimitive.Item
    data-slot='dropdown-menu-item'
    data-inset={inset}
    data-variant={variant}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  />
)

export const DropdownMenuLabel = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) => (
  <DropdownMenuPrimitive.Label
    data-slot='dropdown-menu-label'
    data-inset={inset}
    className={cn(
      'px-2 py-1.5 text-sm font-medium data-[inset]:pl-8',
      className,
    )}
    {...props}
  />
)

export const DropdownMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) => (
  <DropdownMenuPrimitive.Separator
    data-slot='dropdown-menu-separator'
    className={cn('bg-border -mx-1 my-1 h-px', className)}
    {...props}
  />
)
