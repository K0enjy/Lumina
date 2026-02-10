import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { ZenModeProvider } from '@/components/zen/ZenModeContext'
import { AppShell } from '@/components/ui/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumina',
  description: 'A self-hosted productivity app combining task management with note-taking.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ZenModeProvider>
            <AppShell>{children}</AppShell>
          </ZenModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
