'use client'

import { cn } from '@/lib/utils'

type ViewMode = 'month' | 'week' | 'day'

type Props = {
  currentDate: Date
  viewMode: ViewMode
  onDateChange: (date: Date) => void
  onViewModeChange: (mode: ViewMode) => void
}

function formatLabel(date: Date, viewMode: ViewMode): string {
  if (viewMode === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (viewMode === 'week') {
    const start = new Date(date)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function navigate(date: Date, viewMode: ViewMode, direction: -1 | 1): Date {
  const next = new Date(date)
  if (viewMode === 'month') {
    next.setMonth(next.getMonth() + direction)
  } else if (viewMode === 'week') {
    next.setDate(next.getDate() + direction * 7)
  } else {
    next.setDate(next.getDate() + direction)
  }
  return next
}

function CalendarNavBar({ currentDate, viewMode, onDateChange, onViewModeChange }: Props) {
  const viewModes: ViewMode[] = ['month', 'week', 'day']

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-2">
      {/* Left: navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onDateChange(navigate(currentDate, viewMode, -1))}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDateChange(navigate(currentDate, viewMode, 1))}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
          aria-label="Next"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDateChange(new Date())}
          className="ml-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
        >
          Today
        </button>
      </div>

      {/* Center: label */}
      <h2 className="text-lg font-semibold text-[var(--text)] select-none">
        {formatLabel(currentDate, viewMode)}
      </h2>

      {/* Right: view mode toggle */}
      <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
        {viewModes.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              viewMode === mode
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
            )}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}

export { CalendarNavBar }
export type { ViewMode }
