import '@everynews/app/globals.css'
import { siteConfig } from '@everynews/app/site-config'
import { AppFooter } from '@everynews/components/app-footer'
import { AppNavbar } from '@everynews/components/app-navbar'
import { ThemeProvider } from '@everynews/components/theme/provider'
import { Toaster } from '@everynews/components/ui/sonner'
import { dancingScript } from '@everynews/lib/fonts'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

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
    apple: '/logo.png',
    icon: '/logo.png',
  },
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
    <body
      className={`bg-background h-screen flex flex-col ${dancingScript.variable}`}
    >
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <AppNavbar />
        <main className='container mx-auto flex-1'>{children}</main>
        <AppFooter />
        <Toaster richColors position='top-center' />
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
)

export default Layout
