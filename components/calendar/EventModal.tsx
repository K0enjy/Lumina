'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

type CalendarOption = {
  id: string
  displayName: string
  color: string
}

type EventData = {
  id?: string
  calendarId: string
  title: string
  description?: string
  location?: string
  startAt: string
  endAt: string
  allDay: boolean
}

type Props = {
  isOpen: boolean
  onClose: () => void
  event?: EventData
  calendars: CalendarOption[]
  onSave: (data: EventData) => void
  onDelete?: () => void
}

function toDateTimeLocal(isoStr: string): string {
  const d = new Date(isoStr)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${da}T${h}:${mi}`
}

function toDateOnly(isoStr: string): string {
  return isoStr.slice(0, 10)
}

function defaultStart(): string {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  return now.toISOString()
}

function defaultEnd(): string {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 2)
  return now.toISOString()
}

function EventModal({ isOpen, onClose, event, calendars, onSave, onDelete }: Props) {
  const isEditing = Boolean(event?.id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [calendarId, setCalendarId] = useState('')

  // Initialize form when modal opens or event changes
  useEffect(() => {
    if (!isOpen) return

    if (event) {
      setTitle(event.title)
      setDescription(event.description ?? '')
      setLocation(event.location ?? '')
      setStartAt(event.allDay ? toDateOnly(event.startAt) : toDateTimeLocal(event.startAt))
      setEndAt(event.allDay ? toDateOnly(event.endAt) : toDateTimeLocal(event.endAt))
      setAllDay(event.allDay)
      setCalendarId(event.calendarId)
    } else {
      setTitle('')
      setDescription('')
      setLocation('')
      setStartAt(toDateTimeLocal(defaultStart()))
      setEndAt(toDateTimeLocal(defaultEnd()))
      setAllDay(false)
      setCalendarId(calendars[0]?.id ?? '')
    }
  }, [isOpen, event, calendars])

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleAllDayToggle = useCallback((checked: boolean) => {
    setAllDay(checked)
    if (checked) {
      setStartAt(startAt.slice(0, 10))
      setEndAt(endAt.slice(0, 10))
    } else {
      setStartAt(toDateTimeLocal(startAt.includes('T') ? startAt : `${startAt}T09:00`))
      setEndAt(toDateTimeLocal(endAt.includes('T') ? endAt : `${endAt}T10:00`))
    }
  }, [startAt, endAt])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    let finalStart: string
    let finalEnd: string

    if (allDay) {
      finalStart = startAt.slice(0, 10)
      finalEnd = endAt.slice(0, 10)
    } else {
      finalStart = new Date(startAt).toISOString()
      finalEnd = new Date(endAt).toISOString()
    }

    onSave({
      id: event?.id,
      calendarId,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startAt: finalStart,
      endAt: finalEnd,
      allDay,
    })
  }, [title, description, location, startAt, endAt, allDay, calendarId, event, onSave])

  if (!isOpen) return null

  const inputClass =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors'

  const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {isEditing ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label htmlFor="event-title" className={labelClass}>Title</label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Event title"
              required
              autoFocus
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={allDay}
              onClick={() => handleAllDayToggle(!allDay)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer',
                allDay ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  allDay ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
            <span className="text-sm text-[var(--text)]">All day</span>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="event-start" className={labelClass}>Start</label>
              <input
                id="event-start"
                type={allDay ? 'date' : 'datetime-local'}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="event-end" className={labelClass}>End</label>
              <input
                id="event-end"
                type={allDay ? 'date' : 'datetime-local'}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="event-location" className={labelClass}>Location</label>
            <input
              id="event-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              placeholder="Add location"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="event-description" className={labelClass}>Description</label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(inputClass, 'resize-none min-h-[5rem]')}
              placeholder="Add description"
              rows={3}
            />
          </div>

          {/* Calendar selector */}
          {calendars.length > 0 && (
            <div>
              <label htmlFor="event-calendar" className={labelClass}>Calendar</label>
              <select
                id="event-calendar"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className={inputClass}
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !calendarId}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {isEditing ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export { EventModal }
export type { EventData, CalendarOption }
