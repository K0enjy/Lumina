import { Suspense } from 'react'
import { getThemeSettings } from '@/lib/actions/settings'
import { getCaldavAccounts, getCalendars } from '@/lib/actions/calendar'
import { SettingsPageClient } from '@/components/settings/SettingsPageClient'

export const dynamic = 'force-dynamic'

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[1, 2].map(i => (
        <div key={i} className="h-48 rounded-2xl bg-[var(--surface)] animate-pulse" />
      ))}
    </div>
  )
}

async function SettingsLoader() {
  const [themeSettings, accounts, calendars] = await Promise.all([
    getThemeSettings(),
    getCaldavAccounts(),
    getCalendars(),
  ])

  return (
    <SettingsPageClient
      themeSettings={themeSettings}
      accounts={accounts}
      calendars={calendars}
    />
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)]">Settings</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Customize your Lumina experience</p>
      </header>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsLoader />
      </Suspense>
    </div>
  )
}
