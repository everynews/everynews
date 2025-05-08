import '@everynews/app/globals.css'
import { siteConfig } from '@everynews/app/site-config'
import { AppSidebar } from '@everynews/components/app-sidebar'
import { SidebarProvider } from '@everynews/components/ui/sidebar'
import { Toaster } from '@everynews/components/ui/sonner'
import type { Metadata } from 'next'

export const experimental_ppr = true

export const metadata: Metadata = {
  authors: [
    {
      name: 'Sunghyun Cho',
      url: 'https://github.com/anaclumos',
    },
  ],
  creator: '@anaclumos',
  description: siteConfig.description,
  icons: {
    icon: '/logo.png',
  },
  keywords: ['Dashboard', 'Data Visualization', 'Software'],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    locale: 'en_US',
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: 'website',
    url: siteConfig.url,
  },
  title: siteConfig.name,
  twitter: {
    card: 'summary_large_image',
    creator: '@anaclumos',
    description: siteConfig.description,
    title: siteConfig.name,
  },
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <html lang='en' suppressHydrationWarning>
    <body className='bg-white-50 dark:bg-gray-950'>
      <SidebarProvider>
        <AppSidebar />
        <main>{children}</main>
      </SidebarProvider>
      <Toaster richColors position='top-center' />
    </body>
  </html>
)

export default Layout
