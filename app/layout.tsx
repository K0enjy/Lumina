import type { Metadata } from 'next'
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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
