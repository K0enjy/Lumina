import { Suspense } from 'react'
import { getEventsByDateRange, getCalendars, triggerSync, getCaldavAccounts } from '@/lib/actions/calendar'
import { ensureLocalCalendar } from '@/lib/local-calendar'
import { CalendarPageClient } from '@/components/calendar'

export const dynamic = 'force-dynamic'

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-12 rounded-lg bg-[var(--surface)] animate-pulse" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-[var(--surface)] animate-pulse" />
        ))}
      </div>
    </div>
  )
}

async function CalendarLoader() {
  ensureLocalCalendar()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Auto-sync if stale (>5 min)
  const accounts = await getCaldavAccounts()
  const fiveMinAgo = Date.now() - 5 * 60 * 1000
  for (const account of accounts) {
    if (!account.lastSyncAt || account.lastSyncAt < fiveMinAgo) {
      try {
        await triggerSync(account.id)
      } catch {
        // Sync errors are non-blocking
      }
    }
  }

  const start = new Date(year, month, 1).toISOString().split('T')[0]
  const end = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const { events, tasks } = await getEventsByDateRange(start, end)
  const calendars = await getCalendars()

  return (
    <CalendarPageClient
      initialEvents={events}
      initialTasks={tasks}
      calendars={calendars}
    />
  )
}

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarLoader />
      </Suspense>
    </div>
  )
}
