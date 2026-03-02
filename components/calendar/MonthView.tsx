'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { EventPill } from '@/components/calendar/EventPill'
import type { EventWithCalendar } from '@/lib/actions/calendar'

type TaskItem = {
  id: string
  text: string
  status: 'todo' | 'done'
  priority: number
  date: string
}

type Props = {
  currentDate: Date
  events: EventWithCalendar[]
  tasks: TaskItem[]
  onEventClick: (id: string) => void
  onDateClick: (date: string) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_VISIBLE = 3

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatEventTime(startAt: string): string {
  const d = new Date(startAt)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--text-secondary)',
  2: '#f59e0b',
  3: 'var(--error)',
}

function MonthView({ currentDate, events, tasks, onEventClick, onDateClick }: Props) {
  const today = toDateKey(new Date())

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Monday = 0, Sunday = 6
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const days: Date[] = []

    // Days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push(d)
    }

    // Days in current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    // Fill remaining cells to get 6 rows (42 cells)
    while (days.length < 42) {
      const nextIdx = days.length - startOffset - lastDay.getDate()
      days.push(new Date(year, month + 1, nextIdx + 1))
    }

    return days
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventWithCalendar[]>()
    for (const event of events) {
      const startDate = event.startAt.slice(0, 10)
      const endDate = event.endAt.slice(0, 10)

      // For multi-day events, add to each day
      const current = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T00:00:00')
      while (current <= end) {
        const key = toDateKey(current)
        const list = map.get(key) ?? []
        list.push(event)
        map.set(key, list)
        current.setDate(current.getDate() + 1)
      }
    }
    return map
  }, [events])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskItem[]>()
    for (const task of tasks) {
      const list = map.get(task.date) ?? []
      list.push(task)
      map.set(task.date, list)
    }
    return map
  }, [tasks])

  const currentMonth = currentDate.getMonth()

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-[var(--border)]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {calendarDays.map((day) => {
          const key = toDateKey(day)
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday = key === today
          const dayEvents = eventsByDate.get(key) ?? []
          const dayTasks = tasksByDate.get(key) ?? []
          const allItems = [...dayEvents.map((e) => ({ type: 'event' as const, item: e })), ...dayTasks.map((t) => ({ type: 'task' as const, item: t }))]
          const visibleItems = allItems.slice(0, MAX_VISIBLE)
          const overflowCount = allItems.length - MAX_VISIBLE

          return (
            <div
              key={key}
              className={cn(
                'border-b border-r border-[var(--border)] p-1 min-h-[5.5rem] cursor-pointer transition-colors hover:bg-[var(--surface)]',
                !isCurrentMonth && 'opacity-40'
              )}
              onClick={() => onDateClick(key)}
            >
              {/* Day number */}
              <div className="flex justify-end mb-0.5">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full',
                    isToday
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text)]'
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {visibleItems.map((entry) => {
                  if (entry.type === 'event') {
                    const event = entry.item as EventWithCalendar
                    return (
                      <EventPill
                        key={event.id}
                        title={event.title}
                        color={event.calendarColor}
                        time={event.allDay ? undefined : formatEventTime(event.startAt)}
                        allDay={event.allDay}
                        onClick={() => {
                          onEventClick(event.id)
                        }}
                      />
                    )
                  }

                  const task = entry.item as TaskItem
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-1 w-full rounded-md px-1.5 py-0.5 text-xs leading-tight bg-[var(--surface)] border border-[var(--border)] truncate"
                    >
                      <span
                        className={cn(
                          'inline-block w-2.5 h-2.5 rounded-sm border-2 shrink-0',
                          task.status === 'done'
                            ? 'bg-[var(--accent)] border-[var(--accent)]'
                            : 'border-[var(--text-secondary)]/50'
                        )}
                        style={task.status === 'todo' ? { borderColor: PRIORITY_COLORS[task.priority] } : undefined}
                      />
                      <span
                        className={cn(
                          'truncate',
                          task.status === 'done'
                            ? 'line-through text-[var(--text-secondary)]'
                            : 'text-[var(--text)]'
                        )}
                      >
                        {task.text}
                      </span>
                    </div>
                  )
                })}

                {overflowCount > 0 && (
                  <span className="text-[10px] font-medium text-[var(--text-secondary)] px-1.5">
                    +{overflowCount} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { MonthView }
