'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ZenModeContextValue = {
  isZen: boolean
  toggleZen: () => void
  exitZen: () => void
}

const ZenModeContext = createContext<ZenModeContextValue | null>(null)

export function ZenModeProvider({ children }: { children: React.ReactNode }) {
  const [isZen, setIsZen] = useState(false)

  const toggleZen = useCallback(() => setIsZen((prev) => !prev), [])
  const exitZen = useCallback(() => setIsZen(false), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        toggleZen()
      }
      if (e.key === 'Escape' && isZen) {
        exitZen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isZen, toggleZen, exitZen])

  return (
    <ZenModeContext.Provider value={{ isZen, toggleZen, exitZen }}>
      {children}
    </ZenModeContext.Provider>
  )
}

export function useZenMode() {
  const context = useContext(ZenModeContext)
  if (!context) {
    throw new Error('useZenMode must be used within a ZenModeProvider')
  }
  return context
}
