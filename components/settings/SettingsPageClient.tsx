'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { setSetting } from '@/lib/actions/settings'
import { CalendarSettingsClient } from '@/components/calendar'
import { cn } from '@/lib/utils'
import type { ThemeSettings } from '@/lib/actions/settings'
import type { CalendarWithAccount } from '@/lib/actions/calendar'
import type { caldavAccounts } from '@/db/schema'

type CaldavAccount = typeof caldavAccounts.$inferSelect

type Props = {
  themeSettings: ThemeSettings
  accounts: CaldavAccount[]
  calendars: CalendarWithAccount[]
}

const accentPresets = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
]

export function SettingsPageClient({ themeSettings, accounts, calendars }: Props) {
  const { theme, toggleTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [accentColor, setAccentColor] = useState(themeSettings.accentColor)

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
    document.documentElement.style.setProperty('--ring', accentColor)
  }, [accentColor])

  const handleAccentChange = (color: string) => {
    setAccentColor(color)
    startTransition(async () => {
      await setSetting('accentColor', color)
    })
  }

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    toggleTheme()
    startTransition(async () => {
      await setSetting('theme', newTheme)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Theme Section */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Theme</h2>

        <div className="flex flex-col gap-6">
          {/* Dark/Light toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Dark Mode</p>
              <p className="text-xs text-[var(--text-secondary)]">Toggle between light and dark theme</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={handleThemeToggle}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                theme === 'dark' ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Accent color */}
          <div>
            <p className="text-sm font-medium text-[var(--text)] mb-2">Accent Color</p>
            <div className="flex flex-wrap items-center gap-3">
              {accentPresets.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleAccentChange(preset.value)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    accentColor === preset.value
                      ? 'ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--text)]'
                      : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: preset.value }}
                  aria-label={preset.name}
                  title={preset.name}
                />
              ))}
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => handleAccentChange(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                  aria-label="Custom color"
                />
                <span className="text-xs text-[var(--text-secondary)] font-mono">{accentColor}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CalDAV Section */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">CalDAV</h2>
        <CalendarSettingsClient accounts={accounts} calendars={calendars} />
      </section>
    </div>
  )
}
