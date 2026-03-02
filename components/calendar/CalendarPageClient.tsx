'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { CalendarNavBar, type ViewMode } from '@/components/calendar/CalendarNavBar'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { EventModal, type EventData } from '@/components/calendar/EventModal'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
  type CalendarWithAccount,
  type EventWithCalendar,
} from '@/lib/actions/calendar'

type TaskItem = {
  id: string
  text: string
  status: 'todo' | 'done'
  priority: number
  date: string
}

type Props = {
  initialEvents: EventWithCalendar[]
  initialTasks: TaskItem[]
  calendars: CalendarWithAccount[]
}

function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)

  // Extend to cover days visible in month view (prev/next month overflow)
  first.setDate(first.getDate() - 7)
  last.setDate(last.getDate() + 7)

  return {
    start: toDateKey(first),
    end: toDateKey(last),
  }
}

function getWeekRange(date: Date): { start: string; end: string } {
  const start = new Date(date)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start: toDateKey(start), end: toDateKey(end) }
}

function getDayRange(date: Date): { start: string; end: string } {
  const key = toDateKey(date)
  return { start: key, end: key }
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getRange(date: Date, viewMode: ViewMode): { start: string; end: string } {
  switch (viewMode) {
    case 'month':
      return getMonthRange(date)
    case 'week':
      return getWeekRange(date)
    case 'day':
      return getDayRange(date)
  }
}

function CalendarPageClient({ initialEvents, initialTasks, calendars }: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [events, setEvents] = useState<EventWithCalendar[]>(initialEvents)
  const [taskList, setTaskList] = useState<TaskItem[]>(initialTasks)
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventData | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  const calendarOptions = useMemo(
    () =>
      calendars
        .filter((c) => c.enabled)
        .map((c) => ({ id: c.id, displayName: c.displayName, color: c.color ?? '#3b82f6' })),
    [calendars]
  )

  const fetchData = useCallback(
    (date: Date, mode: ViewMode) => {
      startTransition(async () => {
        const { start, end } = getRange(date, mode)
        const result = await getEventsByDateRange(start, end)
        setEvents(result.events)
        setTaskList(result.tasks as TaskItem[])
      })
    },
    []
  )

  const handleDateChange = useCallback(
    (date: Date) => {
      setCurrentDate(date)
      fetchData(date, viewMode)
    },
    [viewMode, fetchData]
  )

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode)
      fetchData(currentDate, mode)
    },
    [currentDate, fetchData]
  )

  const handleEventClick = useCallback(
    (id: string) => {
      const event = events.find((e) => e.id === id)
      if (!event) return

      setSelectedEvent({
        id: event.id,
        calendarId: event.calendarId,
        title: event.title,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        startAt: event.startAt,
        endAt: event.endAt,
        allDay: event.allDay,
      })
      setShowModal(true)
    },
    [events]
  )

  const handleDateClick = useCallback((date: string) => {
    setSelectedEvent(undefined)
    setShowModal(true)

    // Pre-fill the start/end based on clicked date
    const startDate = new Date(`${date}T09:00:00`)
    const endDate = new Date(`${date}T10:00:00`)

    setSelectedEvent({
      calendarId: calendarOptions[0]?.id ?? '',
      title: '',
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      allDay: false,
    })
  }, [calendarOptions])

  const handleSave = useCallback(
    (data: EventData) => {
      startTransition(async () => {
        if (data.id) {
          // Update existing event
          const result = await updateEvent(data.id, {
            title: data.title,
            description: data.description,
            location: data.location,
            startAt: data.startAt,
            endAt: data.endAt,
            allDay: data.allDay,
          })
          if (result.success) {
            setShowModal(false)
            setSelectedEvent(undefined)
            fetchData(currentDate, viewMode)
          }
        } else {
          // Create new event
          const result = await createEvent({
            calendarId: data.calendarId,
            title: data.title,
            description: data.description,
            location: data.location,
            startAt: data.startAt,
            endAt: data.endAt,
            allDay: data.allDay,
          })
          if (result.success) {
            setShowModal(false)
            setSelectedEvent(undefined)
            fetchData(currentDate, viewMode)
          }
        }
      })
    },
    [currentDate, viewMode, fetchData]
  )

  const handleDelete = useCallback(() => {
    if (!selectedEvent?.id) return
    const eventId = selectedEvent.id

    startTransition(async () => {
      const result = await deleteEvent(eventId)
      if (result.success) {
        setShowModal(false)
        setSelectedEvent(undefined)
        fetchData(currentDate, viewMode)
      }
    })
  }, [selectedEvent, currentDate, viewMode, fetchData])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setSelectedEvent(undefined)
  }, [])

  return (
    <div className="flex flex-col h-full min-h-0">
      <CalendarNavBar
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={handleDateChange}
        onViewModeChange={handleViewModeChange}
      />

      {/* Loading indicator */}
      {isPending && (
        <div className="h-0.5 bg-[var(--accent)]/30 overflow-hidden">
          <div className="h-full w-1/3 bg-[var(--accent)] animate-[slide_1s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Active view */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            tasks={taskList}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            tasks={taskList}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            tasks={taskList}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* Event modal */}
      <EventModal
        isOpen={showModal}
        onClose={handleCloseModal}
        event={selectedEvent}
        calendars={calendarOptions}
        onSave={handleSave}
        onDelete={selectedEvent?.id ? handleDelete : undefined}
      />
    </div>
  )
}

export { CalendarPageClient }
