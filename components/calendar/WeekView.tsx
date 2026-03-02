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

const HOUR_HEIGHT = 60
const START_HOUR = 6
const END_HOUR = 24
const TOTAL_HOURS = END_HOUR - START_HOUR

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
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

function formatEventTime(startAt: string): string {
  const d = new Date(startAt)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function WeekView({ currentDate, events, tasks, onEventClick, onDateClick }: Props) {
  const todayKey = toDateKey(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentTimePos, setCurrentTimePos] = useState<number>(-1)

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekKeys = useMemo(() => weekDays.map(toDateKey), [weekDays])

  // Current time indicator
  useEffect(() => {
    function update() {
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
  }, [])

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
    const allDay: Map<string, EventWithCalendar[]> = new Map()
    const timed: Map<string, EventWithCalendar[]> = new Map()

    for (const event of events) {
      const dateKey = event.startAt.slice(0, 10)
      if (event.allDay) {
        const list = allDay.get(dateKey) ?? []
        list.push(event)
        allDay.set(dateKey, list)
      } else {
        const list = timed.get(dateKey) ?? []
        list.push(event)
        timed.set(dateKey, list)
      }
    }

    return { allDayEvents: allDay, timedEvents: timed }
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

  const todayColIndex = weekKeys.indexOf(todayKey)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header with day names */}
      <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-[var(--border)]">
        <div className="border-r border-[var(--border)]" />
        {weekDays.map((day, i) => {
          const key = weekKeys[i]
          const isToday = key === todayKey
          return (
            <div
              key={key}
              className={cn(
                'py-2 text-center border-r border-[var(--border)] cursor-pointer hover:bg-[var(--surface)] transition-colors',
              )}
              onClick={() => onDateClick(key)}
            >
              <div className="text-xs font-medium text-[var(--text-secondary)] uppercase">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full mt-0.5',
                  isToday ? 'bg-[var(--accent)] text-white' : 'text-[var(--text)]'
                )}
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-[var(--border)] min-h-[2rem]">
        <div className="border-r border-[var(--border)] flex items-center justify-center">
          <span className="text-[10px] text-[var(--text-secondary)]">ALL DAY</span>
        </div>
        {weekKeys.map((key) => {
          const dayAllDay = allDayEvents.get(key) ?? []
          const dayTasks = tasksByDate.get(key) ?? []
          return (
            <div key={key} className="border-r border-[var(--border)] p-0.5 flex flex-col gap-0.5">
              {dayAllDay.map((event) => (
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
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs bg-[var(--surface)] border border-[var(--border)] truncate"
                >
                  <span
                    className={cn(
                      'inline-block w-2 h-2 rounded-sm border-2 shrink-0',
                      task.status === 'done'
                        ? 'bg-[var(--accent)] border-[var(--accent)]'
                        : 'border-[var(--text-secondary)]/50'
                    )}
                  />
                  <span
                    className={cn(
                      'truncate',
                      task.status === 'done' ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text)]'
                    )}
                  >
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div
          className="grid grid-cols-[3.5rem_repeat(7,1fr)] relative"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {/* Hour labels */}
          <div className="relative border-r border-[var(--border)]">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                className="absolute right-2 text-[10px] text-[var(--text-secondary)] -translate-y-1/2"
                style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
              >
                {formatHour(START_HOUR + i)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekKeys.map((key, colIdx) => {
            const dayEvents = timedEvents.get(key) ?? []
            return (
              <div
                key={key}
                className="relative border-r border-[var(--border)]"
                onClick={() => onDateClick(key)}
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
                {dayEvents.map((event) => {
                  const top = getTimePosition(event.startAt)
                  const height = getTimeDuration(event.startAt, event.endAt)
                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-80 transition-opacity z-10"
                      style={{
                        top: `${top}%`,
                        height: `${height}%`,
                        minHeight: '1.25rem',
                        backgroundColor: `${event.calendarColor}33`,
                        color: event.calendarColor,
                        borderLeft: `3px solid ${event.calendarColor}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event.id)
                      }}
                      title={`${formatEventTime(event.startAt)} ${event.title}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-[10px] opacity-80">{formatEventTime(event.startAt)}</div>
                    </div>
                  )
                })}

                {/* Current time indicator */}
                {colIdx === todayColIndex && currentTimePos >= 0 && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${currentTimePos}%` }}
                  >
                    <div className="relative">
                      <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-[var(--error)]" />
                      <div className="h-[2px] bg-[var(--error)]" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { WeekView }
