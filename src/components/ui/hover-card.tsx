'use client'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import type { ComponentProps } from 'react'
import { cn } from '~/lib/utils'

const HoverCard = ({
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Root>) => (
  <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
)

const HoverCardTrigger = ({
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Trigger>) => (
  <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
)

const HoverCardContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  showArrow = false,
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Content> & {
  showArrow?: boolean
}) => (
  <HoverCardPrimitive.Content
    data-slot="hover-card-content"
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 rounded-md border p-4 shadow-lg outline-hidden',
      className,
    )}
    {...props}
  >
    {props.children}
    {showArrow && (
      <HoverCardPrimitive.Arrow className="fill-popover -my-px drop-shadow-[0_1px_0_hsl(var(--border))]" />
    )}
  </HoverCardPrimitive.Content>
)

export { HoverCard, HoverCardContent, HoverCardTrigger }
