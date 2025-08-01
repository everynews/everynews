import { cn } from '@everynews/lib/utils'
import type { ReactNode } from 'react'

type FooterProps = {
  children: ReactNode
  className?: string
}

type FooterContentProps = {
  children: ReactNode
  className?: string
}

type FooterColumnProps = {
  children: ReactNode
  className?: string
}

type FooterBottomProps = {
  children: ReactNode
  className?: string
}

const Footer = ({ children, className }: FooterProps) => (
  <div className={cn('py-8', className)}>{children}</div>
)

const FooterContent = ({ children, className }: FooterContentProps) => (
  <div
    className={cn(
      'grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6',
      className,
    )}
  >
    {children}
  </div>
)

const FooterColumn = ({ children, className }: FooterColumnProps) => (
  <div className={cn('flex flex-col gap-3', className)}>{children}</div>
)

const FooterBottom = ({ children, className }: FooterBottomProps) => (
  <div
    className={cn(
      'mt-8 flex flex-col items-center justify-between gap-4 pt-8 md:flex-row',
      className,
    )}
  >
    {children}
  </div>
)

export { Footer, FooterContent, FooterColumn, FooterBottom }
