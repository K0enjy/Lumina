import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { ZenModeProvider } from '@/components/zen/ZenModeContext'
import { AppShell } from '@/components/ui/AppShell'
import { ServiceWorkerRegistrar } from '@/components/ui/ServiceWorkerRegistrar'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Lumina',
  description: 'A self-hosted productivity app combining task management with note-taking.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lumina',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to content
        </a>
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
