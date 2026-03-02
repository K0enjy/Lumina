'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/SidebarProvider'

type SidebarProps = {
  className?: string
}

const navItems = [
  {
    label: 'Today',
    href: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 16V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 10H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 10H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4.93 4.93L6.34 6.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13.66 13.66L15.07 15.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4.93 15.07L6.34 13.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13.66 6.34L15.07 4.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12L13 13L15.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7" cy="11" r="1" fill="currentColor" />
        <circle cx="10" cy="11" r="1" fill="currentColor" />
        <circle cx="13" cy="11" r="1" fill="currentColor" />
        <circle cx="7" cy="14" r="1" fill="currentColor" />
        <circle cx="10" cy="14" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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

const settingsItem = {
  label: 'Settings',
  href: '/settings',
  icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5V4.5M10 15.5V17.5M17.5 10H15.5M4.5 10H2.5M15.3 4.7L13.9 6.1M6.1 13.9L4.7 15.3M15.3 15.3L13.9 13.9M6.1 6.1L4.7 4.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
}

function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, setIsOpen } = useSidebar()

  const closeMobile = useCallback(() => setIsOpen(false), [setIsOpen])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
      active
        ? 'border-l-2 border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
        : 'border-l-2 border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
    )

  const navContent = (
    <nav aria-label="Main navigation" className="flex flex-col flex-1 px-3">
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              aria-current={active ? 'page' : undefined}
              className={linkClass(active)}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-[var(--border)]">
        <Link
          href={settingsItem.href}
          onClick={closeMobile}
          aria-current={isActive(settingsItem.href) ? 'page' : undefined}
          className={linkClass(isActive(settingsItem.href))}
        >
          {settingsItem.icon}
          {settingsItem.label}
        </Link>
      </div>
    </nav>
  )

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-[var(--text)]">Lumina</span>
      </div>
      {navContent}
    </div>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        aria-label="Sidebar navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-[var(--surface)] border-r border-[var(--border)] transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {sidebarInner}
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside
        aria-label="Sidebar navigation"
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
