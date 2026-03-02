'use client'

import Link from 'next/link'
import type { EventWithCalendar } from '@/lib/actions/calendar'

type Props = {
  events: EventWithCalendar[]
}

function formatTime(isoStr: string, allDay: boolean): string {
  if (allDay) return 'All day'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function DashboardEvents({ events }: Props) {
  const sorted = [...events].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
    return a.startAt.localeCompare(b.startAt)
  })

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">Events</h2>
        <Link href="/calendar" className="text-sm text-[var(--accent)] hover:underline">
          Calendar &rarr;
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-[var(--text-secondary)]">
          <svg width="32" height="32" viewBox="0 0 20 20" fill="none" className="mb-2 opacity-40" aria-hidden="true">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm">No events today</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(event => (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 border border-[var(--text-secondary)]/10"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.calendarColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{event.title}</p>
                {event.location && (
                  <p className="text-xs text-[var(--text-secondary)] truncate">{event.location}</p>
                )}
              </div>
              <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                {formatTime(event.startAt, event.allDay)}
                {!event.allDay && ` - ${formatTime(event.endAt, false)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
