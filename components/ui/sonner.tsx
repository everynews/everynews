'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps, toast } from 'sonner'

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-border': 'var(--border)',
          '--normal-text': 'var(--popover-foreground)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { toast }
