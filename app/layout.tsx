import '@everynews/app/globals.css'
import { siteConfig } from '@everynews/app/site-config'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className='h-full' suppressHydrationWarning>
      <body className='bg-white-50 h-full antialiased dark:bg-gray-950'>
        {children}
      </body>
    </html>
  )
}
