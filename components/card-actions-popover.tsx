'use client'

import { Button } from '@everynews/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@everynews/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import { type ReactNode, useState } from 'react'

interface CardActionsPopoverProps {
  children: ReactNode
}

export const CardActionsPopover = ({ children }: CardActionsPopoverProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='size-8'
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <MoreVertical className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DropdownMenuItem, DropdownMenuSeparator }
