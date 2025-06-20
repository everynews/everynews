import { SheetClose } from '@everynews/components/ui/sheet'
import Link from 'next/link'

interface MobileSidebarLinkProps {
  href: string
  children: React.ReactNode
  badge?: number
}

export const MobileSidebarLink = ({
  href,
  children,
  badge,
}: MobileSidebarLinkProps) => (
  <SheetClose asChild>
    <Link
      href={href}
      className='flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
    >
      <span>{children}</span>
      {badge !== undefined && (
        <span className='text-sm text-muted-foreground'>{badge}</span>
      )}
    </Link>
  </SheetClose>
)
