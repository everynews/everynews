'use client'

import { cn } from '@everynews/lib/utils'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as React from 'react'

export const Label = ({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) => (
  <LabelPrimitive.Root
    data-slot='label'
    className={cn(
      'text-foreground text-sm leading-4 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      className,
    )}
    {...props}
  />
)
