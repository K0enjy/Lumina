import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { ZenModeProvider } from '@/components/zen/ZenModeContext'
import { AppShell } from '@/components/ui/AppShell'
import { ServiceWorkerRegistrar } from '@/components/ui/ServiceWorkerRegistrar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumina',
  description: 'A self-hosted productivity app combining task management with note-taking.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lumina',
  },
}

export const viewport: Viewport = {
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ServiceWorkerRegistrar />
        <ThemeProvider>
          <ZenModeProvider>
            <AppShell>{children}</AppShell>
          </ZenModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
