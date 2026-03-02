import { Suspense } from 'react'
import { getTasksByDate } from '@/lib/actions/tasks'
import { getEventsByDateRange } from '@/lib/actions/calendar'
import { getRecentNotes } from '@/lib/actions/notes'
import { ensureLocalCalendar } from '@/lib/local-calendar'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-48 rounded-2xl bg-[var(--surface)] animate-pulse" />
      ))}
    </div>
  )
}

async function DashboardLoader() {
  const today = new Date().toISOString().split('T')[0]

  ensureLocalCalendar()

  const [tasks, { events }, recentNotes] = await Promise.all([
    getTasksByDate(today),
    getEventsByDateRange(today, today),
    getRecentNotes(4),
  ])

  return (
    <DashboardClient
      tasks={tasks}
      events={events}
      recentNotes={recentNotes}
    />
  )
}

export default function TodayPage() {
  const now = new Date()
  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)]">Today</h1>
        <p className="mt-1 text-[var(--text-secondary)]">{formatted}</p>
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardLoader />
      </Suspense>
    </div>
  )
}
