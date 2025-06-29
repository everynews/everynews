import { FooterStats } from '@everynews/components/footer-stats'
import { ThemeToggle } from '@everynews/components/theme/toggle'
import {
  Footer,
  FooterBottom,
  FooterColumn,
  FooterContent,
} from '@everynews/components/ui/footer'
import { cn } from '@everynews/lib/utils'
import { Logo } from '@everynews/public/logo'
import Link from 'next/link'
import type { ReactNode } from 'react'

type FooterLink = {
  text: string
  href: string
}

type FooterColumnProps = {
  title: string
  links: FooterLink[]
}

type FooterProps = {
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
  name = 'Everynews',
  columns = [
    {
      links: [
        { href: 'https://antiagile.every.news/', text: 'The Story Behind' },
        { href: '/firefighter-mode', text: 'Firefighter Mode' },
      ],
      title: 'Story',
    },
    {
      links: [
        { href: 'https://github.com/everynews/everynews', text: 'GitHub' },
        { href: 'https://x.com/everydotnews', text: 'Twitter' },
      ],
      title: 'Socials',
    },
  ],
  copyright = '© 2025 Everynews. All rights reserved.',
  policies = [
    { href: '/privacy', text: 'Privacy Policy' },
    { href: '/terms', text: 'Terms of Service' },
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
            <FooterColumn>
              <h3 className='text-md pt-1 font-semibold'>Stats</h3>
              <FooterStats />
            </FooterColumn>
            {columns.map((column) => (
              <FooterColumn key={column.title}>
                <h3 className='text-md pt-1 font-semibold'>{column.title}</h3>
                {column.links.map((link) => (
                  <Link
                    key={link.text}
                    href={link.href}
                    className='text-muted-foreground text-sm hover:text-foreground'
                  >
                    {link.text}
                  </Link>
                ))}
              </FooterColumn>
            ))}
          </FooterContent>
          <FooterBottom className='p-2'>
            <div className='text-sm text-muted-foreground'>{copyright}</div>
            <div className='flex items-center gap-4'>
              {policies.map((policy) => (
                <Link
                  key={policy.text}
                  href={policy.href}
                  className='text-sm text-muted-foreground hover:text-foreground'
                >
                  {policy.text}
                </Link>
              ))}
              {showThemeToggle && <ThemeToggle />}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  )
}
