'use client'

import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarProvider'
import { Sidebar } from '@/components/ui/Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useZenMode } from '@/components/zen/ZenModeContext'

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

function ZenExitButton() {
  const { exitZen } = useZenMode()

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={exitZen}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-lg bg-[var(--surface)]/80 backdrop-blur-sm px-3 py-1.5 text-sm text-[var(--text-secondary)] shadow-lg hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
      aria-label="Exit Zen Mode"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
      Exit Zen
    </motion.button>
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
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-1 flex-col ${isZen ? '' : 'md:ml-60'}`}>
        <AnimatePresence>
          {!isZen && (
            <motion.div
              key="header"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Header />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Zen mode backdrop overlay */}
          <AnimatePresence>
            {isZen && (
              <motion.div
                key="zen-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-10 bg-[var(--bg)]/80 backdrop-blur-sm"
              />
            )}
          </AnimatePresence>

          {/* Content wrapper — centered with max-width in zen mode */}
          <div className={isZen ? 'relative z-20 mx-auto max-w-[700px]' : ''}>
            {children}
          </div>
        </main>
      </div>

      {/* Floating exit button in zen mode */}
      <AnimatePresence>
        {isZen && <ZenExitButton key="zen-exit" />}
      </AnimatePresence>
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
