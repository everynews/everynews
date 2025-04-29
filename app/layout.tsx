import '@everynews/app/globals.css'
import { siteConfig } from '@everynews/app/site-config'
import { AppSidebar } from '@everynews/components/app-sidebar'
import { Breadcrumbs } from '@everynews/components/breadcurmbs'
import {
  SidebarProvider,
  SidebarTrigger,
} from '@everynews/components/ui/sidebar'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { cookies } from 'next/headers'

export const experimental_ppr = true

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: ['Dashboard', 'Data Visualization', 'Software'],
  authors: [
    {
      name: 'Sunghyun Cho',
      url: 'https://github.com/anaclumos',
    },
  ],
  creator: '@anaclumos',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: '@anaclumos',
  },
  icons: {
    icon: '/logo.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true'

  return (
    <html lang='en' className='h-full' suppressHydrationWarning>
      <body className='bg-white-50 h-full antialiased dark:bg-gray-950'>
        <ThemeProvider
          defaultTheme='system'
          disableTransitionOnChange
          attribute='class'
        >
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <div className='w-full'>
              <header className='sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950'>
                <SidebarTrigger className='-ml-1' />
                <div className='mr-2 h-4 w-px bg-gray-200 dark:bg-gray-800' />
                <Breadcrumbs />
              </header>
              <main>{children}</main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
