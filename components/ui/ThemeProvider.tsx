'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
  children: ReactNode
  initialTheme?: Theme
  initialAccentColor?: string
}

function ThemeProvider({ children, initialTheme, initialAccentColor }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? 'light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme)
      setMounted(true)
      return
    }

    const stored = localStorage.getItem('lumina-theme') as Theme | null
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
    setMounted(true)
  }, [initialTheme])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('lumina-theme', theme)
  }, [theme, mounted])

  useEffect(() => {
    if (initialAccentColor) {
      document.documentElement.style.setProperty('--accent', initialAccentColor)
      document.documentElement.style.setProperty('--ring', initialAccentColor)
    }
  }, [initialAccentColor])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext>
  )
}

function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export { ThemeProvider, useTheme }
export type { Theme, ThemeContextValue }
