import { ReactNode } from 'react'
import { siteConfig } from '@everynews/app/site-config'
import { cn } from '@everynews/lib/utils'
import { Logo } from '@everynews/public/logo'
import { ThemeToggle } from '@everynews/components/theme/toggle'
import {
  Footer,
  FooterBottom,
  FooterColumn,
  FooterContent,
} from '@everynews/components/ui/footer'

interface FooterLink {
  text: string
  href: string
}

interface FooterColumnProps {
  title: string
  links: FooterLink[]
}

interface FooterProps {
  logo?: ReactNode
  name?: string
  columns?: FooterColumnProps[]
  copyright?: string
  policies?: FooterLink[]
  showThemeToggle?: boolean
  className?: string
}

export const AppFooter = ({
  logo = <Logo />,
  name = 'every.news',
  columns = [
    {
      title: 'About',
      links: [
        { text: 'The Story Behind', href: 'https://antiagile.every.news/' },
        { text: 'The Three-day Turnaround', href: '/three-day-turnaround' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { text: 'GitHub', href: 'https://github.com/everynews/everynews' },
      ],
    },
  ],
  copyright = '© 2025 every.news. All rights reserved.',
  policies = [
    { text: 'Privacy Policy', href: '/privacy' },
    { text: 'Terms of Service', href: '/terms' },
  ],
  showThemeToggle = true,
  className,
}: FooterProps) => {
  return (
    <footer className={cn('bg-background w-full px-4', className)}>
      <div className='container mx-auto'>
        <Footer>
          <FooterContent>
            <FooterColumn className='col-span-2 sm:col-span-3 md:col-span-1'>
              <div className='flex items-center gap-2'>
                {logo}
                <h3 className='text-xl font-bold'>{name}</h3>
              </div>
            </FooterColumn>
            {columns.map((column, index) => (
              <FooterColumn key={index}>
                <h3 className='text-md pt-1 font-semibold'>{column.title}</h3>
                {column.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.href}
                    className='text-muted-foreground text-sm hover:text-foreground'
                  >
                    {link.text}
                  </a>
                ))}
              </FooterColumn>
            ))}
          </FooterContent>
          <FooterBottom>
            <div className='text-sm text-muted-foreground'>{copyright}</div>
            <div className='flex items-center gap-4'>
              {policies.map((policy, index) => (
                <a key={index} href={policy.href} className='text-sm text-muted-foreground hover:text-foreground'>
                  {policy.text}
                </a>
              ))}
              {showThemeToggle && <ThemeToggle />}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  )
}