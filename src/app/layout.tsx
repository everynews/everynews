import { Toaster } from '@everynews/components/ui/sonner'
import { ThemeProvider } from '@everynews/providers/theme-provider'
import { Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import { AppSidebar } from '@everynews/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@everynews/components/ui/sidebar'
import { cn } from '@everynews/lib/utils'
import type { ReactNode } from 'react'

const fontSans = Bricolage_Grotesque({
  variable: '--font-sans',
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
        className={cn(
          'bg-sidebar min-h-screen font-sans antialiased',
          fontSans.variable,
        )}
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
