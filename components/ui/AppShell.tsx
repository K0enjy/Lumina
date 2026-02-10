'use client'

import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarProvider'
import { Sidebar } from '@/components/ui/Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useZenMode } from '@/components/zen/ZenModeContext'
import { ZenMode } from '@/components/zen/ZenMode'
import { CommandPalette } from '@/components/search/CommandPalette'

function Header() {
  const { toggle } = useSidebar()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4 md:justify-end">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)] md:hidden"
        aria-label="Open sidebar"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* ThemeToggle — always visible, aligned right */}
      <ThemeToggle />
    </header>
  )
}

function AppShellContent({ children }: { children: ReactNode }) {
  const { isZen } = useZenMode()

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>
        {!isZen && (
          <motion.div
            key="sidebar"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -240 }}
            transition={{ duration: 0.3 }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-1 flex-col transition-[margin] duration-300 ${isZen ? '' : 'md:ml-60'}`}>
        <AnimatePresence>
          {!isZen && (
            <motion.div
              key="header"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -56 }}
              transition={{ duration: 0.3 }}
            >
              <Header />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Content wrapper — centered with max-width in zen mode */}
          <div className={isZen ? 'relative z-20 mx-auto max-w-[700px]' : ''}>
            {children}
          </div>
        </main>
      </div>

      <ZenMode />
      <CommandPalette />
    </div>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  )
}

export { AppShell }
