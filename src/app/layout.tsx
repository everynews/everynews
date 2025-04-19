import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '~/components/ui/sonner'
import { ThemeProvider } from '~/providers/theme-provider'
import './globals.css'
import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { AppSidebar } from '~/components/app-sidebar'

const fontSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const fontMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} bg-sidebar font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
              <Toaster />
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
