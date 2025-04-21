'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ExpandDownIcon } from '~/icons'
import type { ComponentProps } from 'react'
import { cn } from '~/lib/utils'

const Accordion = ({
  ...props
}: ComponentProps<typeof AccordionPrimitive.Root>) => (
  <AccordionPrimitive.Root data-slot="accordion" {...props} />
)

const AccordionItem = ({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) => (
  <AccordionPrimitive.Item
    data-slot="accordion-item"
    className={cn('border-b last:border-b-0', className)}
    {...props}
  />
)

const AccordionTrigger = ({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      data-slot="accordion-trigger"
      className={cn(
        'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-sm font-semibold transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ExpandDownIcon className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
)

const AccordionContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) => (
  <AccordionPrimitive.Content
    data-slot="accordion-content"
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
    {...props}
  >
    <div className={cn('pt-0 pb-4', className)}>{children}</div>
  </AccordionPrimitive.Content>
)

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
