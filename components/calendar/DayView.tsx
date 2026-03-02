'use client'

import { useMemo, useEffect, useState, useRef } from 'react'
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

const HOUR_HEIGHT = 64
const START_HOUR = 6
const END_HOUR = 24
const TOTAL_HOURS = END_HOUR - START_HOUR

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTimePosition(dateStr: string): number {
  const d = new Date(dateStr)
  const hours = d.getHours() + d.getMinutes() / 60
  return Math.max(0, (hours - START_HOUR) / TOTAL_HOURS) * 100
}

function getTimeDuration(startStr: string, endStr: string): number {
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  return Math.max(0.5, diffHours / TOTAL_HOURS) * 100
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function formatEventTime(startAt: string, endAt: string): string {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const s = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const e = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${s} – ${e}`
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--text-secondary)',
  2: '#f59e0b',
  3: 'var(--error)',
}

function DayView({ currentDate, events, tasks, onEventClick, onDateClick }: Props) {
  const dateKey = toDateKey(currentDate)
  const todayKey = toDateKey(new Date())
  const isToday = dateKey === todayKey
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentTimePos, setCurrentTimePos] = useState<number>(-1)

  // Current time indicator
  useEffect(() => {
    function update() {
      if (!isToday) {
        setCurrentTimePos(-1)
        return
      }
      const now = new Date()
      const hours = now.getHours() + now.getMinutes() / 60
      if (hours >= START_HOUR && hours <= END_HOUR) {
        setCurrentTimePos(((hours - START_HOUR) / TOTAL_HOURS) * 100)
      } else {
        setCurrentTimePos(-1)
      }
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [isToday])

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date()
      const hours = now.getHours()
      const scrollTo = Math.max(0, (hours - START_HOUR - 1)) * HOUR_HEIGHT
      scrollRef.current.scrollTop = scrollTo
    }
  }, [])

  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: EventWithCalendar[] = []
    const timed: EventWithCalendar[] = []

    for (const event of events) {
      const eventDate = event.startAt.slice(0, 10)
      if (eventDate !== dateKey && event.endAt.slice(0, 10) !== dateKey) continue
      if (event.allDay) {
        allDay.push(event)
      } else {
        timed.push(event)
      }
    }

    return { allDayEvents: allDay, timedEvents: timed }
  }, [events, dateKey])

  const dayTasks = useMemo(() => tasks.filter((t) => t.date === dateKey), [tasks, dateKey])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* All-day events + tasks */}
      {(allDayEvents.length > 0 || dayTasks.length > 0) && (
        <div className="border-b border-[var(--border)] p-2">
          <div className="flex items-center gap-2 flex-wrap">
            {allDayEvents.map((event) => (
              <EventPill
                key={event.id}
                title={event.title}
                color={event.calendarColor}
                allDay
                onClick={() => onEventClick(event.id)}
              />
            ))}
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs bg-[var(--surface)] border border-[var(--border)]"
              >
                <span
                  className={cn(
                    'inline-block w-3 h-3 rounded-sm border-2 shrink-0',
                    task.status === 'done'
                      ? 'bg-[var(--accent)] border-[var(--accent)]'
                      : 'border-[var(--text-secondary)]/50'
                  )}
                  style={task.status === 'todo' ? { borderColor: PRIORITY_COLORS[task.priority] } : undefined}
                />
                <span
                  className={cn(
                    task.status === 'done'
                      ? 'line-through text-[var(--text-secondary)]'
                      : 'text-[var(--text)]'
                  )}
                >
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div
          className="grid grid-cols-[4rem_1fr] relative"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {/* Hour labels */}
          <div className="relative border-r border-[var(--border)]">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute right-3 text-xs text-[var(--text-secondary)] -translate-y-1/2"
                style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
              >
                {formatHour(START_HOUR + i)}
              </div>
            ))}
          </div>

          {/* Event column */}
          <div
            className="relative"
            onClick={() => onDateClick(dateKey)}
          >
            {/* Hour lines */}
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-[var(--border)]/50"
                style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
              />
            ))}

            {/* Timed events */}
            {timedEvents.map((event) => {
              const top = getTimePosition(event.startAt)
              const height = getTimeDuration(event.startAt, event.endAt)
              return (
                <div
                  key={event.id}
                  className="absolute left-1 right-4 rounded-lg px-3 py-1.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity z-10"
                  style={{
                    top: `${top}%`,
                    height: `${height}%`,
                    minHeight: '1.5rem',
                    backgroundColor: `${event.calendarColor}33`,
                    color: event.calendarColor,
                    borderLeft: `4px solid ${event.calendarColor}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(event.id)
                  }}
                  title={event.title}
                >
                  <div className="font-medium text-sm truncate">{event.title}</div>
                  <div className="text-xs opacity-80">
                    {formatEventTime(event.startAt, event.endAt)}
                  </div>
                  {event.location && (
                    <div className="text-xs opacity-70 truncate mt-0.5">{event.location}</div>
                  )}
                </div>
              )
            })}

            {/* Current time indicator */}
            {currentTimePos >= 0 && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${currentTimePos}%` }}
              >
                <div className="relative">
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-[var(--error)]" />
                  <div className="h-[2px] bg-[var(--error)]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { DayView }
