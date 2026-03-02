import { Suspense } from 'react'
import { getCaldavAccounts, getCalendars } from '@/lib/actions/calendar'
import { CalendarSettingsClient } from '@/components/calendar'

export const dynamic = 'force-dynamic'

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2].map(i => (
        <div key={i} className="h-32 rounded-lg bg-[var(--surface)] animate-pulse" />
      ))}
    </div>
  )
}

async function SettingsLoader() {
  const accounts = await getCaldavAccounts()
  const calendars = await getCalendars()

  return <CalendarSettingsClient accounts={accounts} calendars={calendars} />
}

export default function CalendarSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)]">Calendar Settings</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Manage your CalDAV accounts and calendars</p>
      </header>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsLoader />
      </Suspense>
    </div>
  )
}
