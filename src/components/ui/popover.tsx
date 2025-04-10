'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'
import { cn } from '~/lib/cn'

const Popover = ({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
)

const PopoverTrigger = ({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Trigger>) => (
  <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
)

const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  showArrow = false,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content> & {
  showArrow?: boolean
}) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border p-4 shadow-md outline-hidden',
        className,
      )}
      {...props}
    >
      {props.children}
      {showArrow && (
        <PopoverPrimitive.Arrow className="fill-popover -my-px drop-shadow-[0_1px_0_hsl(var(--border))]" />
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
)

const PopoverAnchor = ({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Anchor>) => (
  <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
)

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
