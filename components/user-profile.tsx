'use client'

import { DropdownUserProfile } from '@everynews/components/drowpdown-user-profiles'
import { Button } from '@everynews/components/ui/button'
import { cx, focusRing } from '@everynews/lib/utils'
import { ChevronsUpDown } from 'lucide-react'

export function UserProfile() {
  return (
    <DropdownUserProfile>
      <Button
        aria-label='User settings'
        variant='ghost'
        className={cx(
          'group flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200/50 data-[state=open]:bg-gray-200/50 dark:hover:bg-gray-800/50 dark:data-[state=open]:bg-gray-900',
          focusRing,
        )}
      >
        <span className='flex items-center gap-3'>
          <span
            className='flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
            aria-hidden='true'
          >
            ES
          </span>
          <span>Emma Stone</span>
        </span>
        <ChevronsUpDown
          className='size-4 shrink-0 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400'
          aria-hidden='true'
        />
      </Button>
    </DropdownUserProfile>
  )
}
