'use client'

import { Button } from '@everynews/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@everynews/components/ui/sheet'
import { Menu } from 'lucide-react'

interface MobileSidebarShellProps {
  children: React.ReactNode
  title?: string
  header?: React.ReactNode
  footer?: React.ReactNode
}

export const MobileSidebarShell = ({
  children,
  title,
  header,
  footer,
}: MobileSidebarShellProps) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='outline' size='icon' className='md:hidden'>
        <Menu className='size-4' />
        <span className='sr-only'>Open menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side='left' className='flex flex-col pt-12'>
      <SheetHeader className='px-4 pb-4'>
        {header}
        {title && <SheetTitle>{title}</SheetTitle>}
      </SheetHeader>
      <nav className='flex flex-col gap-3 px-0.5 flex-1 overflow-y-auto'>
        {children}
      </nav>
      {footer}
    </SheetContent>
  </Sheet>
)
