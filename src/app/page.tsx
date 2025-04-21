import { ExpandDownIcon, PrevIcon, NextIcon } from '~/icons'
import ThemeToggle from '~/components/theme-toggle'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'

export default function Page() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
        <div
          className={cn(
            'flex flex-col justify-between gap-2 py-5 sm:flex-row sm:items-center sm:px-4',
          )}
        >
          <div className="flex justify-between gap-1.5 max-sm:items-center sm:flex-col">
            <div className="flex items-center gap-1.5">
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
                  <PrevIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="max-sm:size-8"
                  aria-label="Next"
                >
                  <NextIcon />
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
                    <ExpandDownIcon className="-me-1 opacity-60" />
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
    </>
  )
}
