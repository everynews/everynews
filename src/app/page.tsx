'use client'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Everynews",
//   description: "Everynews",
// };

import { AppSidebar } from '~/components/app-sidebar'
import ThemeToggle from '~/components/theme-toggle'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '~/components/ui/sidebar'
import { cn } from '~/lib/cn'

export default function Page() {
  const { open } = useSidebar()
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <div className='flex flex-1 flex-col gap-4 p-2 pt-0'>
          <div
            className={cn(
              'flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-5 sm:px-4',
            )}
          >
            <div className='flex sm:flex-col max-sm:items-center justify-between gap-1.5'>
              <div className='flex items-center gap-1.5'>
                <SidebarTrigger
                  data-state={open ? 'invisible' : 'visible'}
                  className='peer size-7 text-muted-foreground/80 hover:text-foreground/80 hover:bg-transparent! sm:-ms-1.5 lg:data-[state=invisible]:opacity-0 lg:data-[state=invisible]:pointer-events-none transition-opacity ease-in-out duration-200'
                  isOutsideSidebar
                />
                <h2 className='font-semibold text-xl lg:peer-data-[state=invisible]:-translate-x-7.5 transition-transform ease-in-out duration-300'>
                  Title
                </h2>
              </div>
            </div>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center sm:gap-2 max-sm:order-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='max-sm:size-8'
                    aria-label='Previous'
                  >
                    <ChevronLeftIcon size={16} aria-hidden='true' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='max-sm:size-8'
                    aria-label='Next'
                  >
                    <ChevronRightIcon size={16} aria-hidden='true' />
                  </Button>
                </div>
                <Button className='max-sm:h-8 max-sm:px-2.5!'>Today</Button>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <Button variant='outline' className='max-sm:h-8 max-sm:px-2.5!'>
                  New Event
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      className='gap-1.5 max-sm:h-8 max-sm:px-2! max-sm:gap-1'
                    >
                      <span className='capitalize'>Month</span>
                      <ChevronDownIcon
                        className='-me-1 opacity-60'
                        size={16}
                        aria-hidden='true'
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='min-w-32'>
                    <DropdownMenuItem>
                      Month <DropdownMenuShortcut>M</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Week <DropdownMenuShortcut>W</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Day <DropdownMenuShortcut>D</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className='flex flex-1 flex-col'>Main Text</div>
        </div>
      </SidebarInset>
    </>
  )
}
