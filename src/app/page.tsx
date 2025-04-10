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
        <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
          <div
            className={cn(
              'flex flex-col justify-between gap-2 py-5 sm:flex-row sm:items-center sm:px-4',
            )}
          >
            <div className="flex justify-between gap-1.5 max-sm:items-center sm:flex-col">
              <div className="flex items-center gap-1.5">
                <SidebarTrigger
                  data-state={open ? 'invisible' : 'visible'}
                  className="peer text-muted-foreground/80 hover:text-foreground/80 size-7 transition-opacity duration-200 ease-in-out hover:bg-transparent! sm:-ms-1.5 lg:data-[state=invisible]:pointer-events-none lg:data-[state=invisible]:opacity-0"
                  isOutsideSidebar
                />
                <h2 className="text-xl font-semibold transition-transform duration-300 ease-in-out lg:peer-data-[state=invisible]:-translate-x-7.5">
                  Title
                </h2>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center max-sm:order-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="max-sm:size-8"
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="max-sm:size-8"
                    aria-label="Next"
                  >
                    <ChevronRightIcon size={16} aria-hidden="true" />
                  </Button>
                </div>
                <Button className="max-sm:h-8 max-sm:px-2.5!">Today</Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" className="max-sm:h-8 max-sm:px-2.5!">
                  New Event
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-1.5 max-sm:h-8 max-sm:gap-1 max-sm:px-2!"
                    >
                      <span className="capitalize">Month</span>
                      <ChevronDownIcon
                        className="-me-1 opacity-60"
                        size={16}
                        aria-hidden="true"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-32">
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

          <div className="flex flex-1 flex-col">Main Text</div>
        </div>
      </SidebarInset>
    </>
  )
}
