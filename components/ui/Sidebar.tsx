'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type SidebarProps = {
  className?: string
}

const navItems = [
  {
    label: 'Today',
    href: '/',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="14"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M6 3H14C15.1046 3 16 3.89543 16 5V15C16 16.1046 15.1046 17 14 17H6C4.89543 17 4 16.1046 4 15V5C4 3.89543 4.89543 3 6 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M7 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const

function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const navContent = (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobile}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              active
                ? 'border-l-2 border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-l-2 border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const sidebarInner = (
    <div className="flex h-full flex-col">
      {/* Logo / Title */}
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-[var(--text)]">Lumina</span>
      </div>

      {/* Navigation */}
      {navContent}
    </div>
  )

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)] md:hidden"
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

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-[var(--surface)] border-r border-[var(--border)] transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {sidebarInner}
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside
        className={cn(
          'hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col bg-[var(--surface)] border-r border-[var(--border)]',
          className
        )}
      >
        {sidebarInner}
      </aside>
    </>
  )
}

export { Sidebar }
export type { SidebarProps }
