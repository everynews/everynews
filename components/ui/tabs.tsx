'use client'

import { cn } from '@everynews/lib/utils'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'

export const Tabs = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root
    data-slot='tabs'
    className={cn('flex flex-col gap-2', className)}
    {...props}
  />
)

export const TabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    data-slot='tabs-list'
    className={cn(
      'bg-muted text-muted-foreground/70 inline-flex w-fit items-center justify-center rounded-md p-0.5',
      className,
    )}
    {...props}
  />
)

export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    data-slot='tabs-trigger'
    className={cn(
      'hover:text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs [&_svg]:shrink-0 cursor-pointer',
      className,
    )}
    {...props}
  />
)

export const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    data-slot='tabs-content'
    className={cn('flex-1 outline-none', className)}
    {...props}
  />
)
