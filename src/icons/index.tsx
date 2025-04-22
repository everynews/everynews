// Centralised semantic icon exports.
//
// Each export is a re‑export (often under an alias) of the corresponding
// icon component from `@heroicons/react/24/outline`.
//
// Re‑exporting everything from a single module means the rest of the
// application code does not need to know (or care) which icon pack we are
// using internally – making it trivial to change the underlying provider in
// the future.

import { forwardRef } from 'react'
import type { ComponentProps } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import { cn } from '~/lib/utils'

// Helper to create wrapped icon components with forwardRef
const createIcon = (
  Icon: React.ComponentType<React.ComponentProps<'svg'>>,
  displayName: string,
) => {
  const WrappedIcon = forwardRef<SVGSVGElement, ComponentProps<typeof Icon>>(
    ({ className, ...props }, ref) => (
      <Icon ref={ref} className={cn('size-4', className)} {...props} />
    ),
  )

  WrappedIcon.displayName = displayName
  return WrappedIcon
}

// Navigation / chevrons
export const PrevIcon = createIcon(HeroIcons.ChevronLeftIcon, 'PrevIcon')

export const NextIcon = createIcon(HeroIcons.ChevronRightIcon, 'NextIcon')

export const ExpandDownIcon = createIcon(
  HeroIcons.ChevronDownIcon,
  'ExpandDownIcon',
)

export const ExpandUpIcon = createIcon(HeroIcons.ChevronUpIcon, 'ExpandUpIcon')

// UI chrome
export const CloseIcon = createIcon(HeroIcons.XMarkIcon, 'CloseIcon')

export const SearchIcon = createIcon(
  HeroIcons.MagnifyingGlassIcon,
  'SearchIcon',
)

export const CheckmarkIcon = createIcon(HeroIcons.CheckIcon, 'CheckmarkIcon')

export const BulletIcon = createIcon(HeroIcons.CircleStackIcon, 'BulletIcon')

export const PasskeyIcon = createIcon(HeroIcons.KeyIcon, 'PasskeyIcon')

export const SpinnerIcon = createIcon(HeroIcons.ArrowPathIcon, 'SpinnerIcon')

// Sidebar controls
export const SidebarExpandIcon = createIcon(
  HeroIcons.ChevronRightIcon,
  'SidebarExpandIcon',
)

export const SidebarCollapseIcon = createIcon(
  HeroIcons.ChevronLeftIcon,
  'SidebarCollapseIcon',
)

// Theme toggle
export const SunIcon = createIcon(HeroIcons.SunIcon, 'SunIcon')

export const MoonIcon = createIcon(HeroIcons.MoonIcon, 'MoonIcon')

export const LogoutIcon = createIcon(
  HeroIcons.ArrowLeftStartOnRectangleIcon,
  'LogoutIcon',
)

// Misc
export const MenuExpandIcon = createIcon(
  HeroIcons.ChevronUpDownIcon,
  'MenuExpandIcon',
)

export const AccountsIcon = createIcon(HeroIcons.UserGroupIcon, 'AccountsIcon')

export const ProfileIcon = createIcon(HeroIcons.UserIcon, 'ProfileIcon')

export const SparkleIcon = createIcon(HeroIcons.SparklesIcon, 'SparkleIcon')

export const MoreIcon = createIcon(HeroIcons.EllipsisHorizontalIcon, 'MoreIcon')
