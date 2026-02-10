'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type SidebarContextValue = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <SidebarContext value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </SidebarContext>
  )
}

function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export { SidebarProvider, useSidebar }
export type { SidebarContextValue }
