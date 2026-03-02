'use server'

import { db } from '@/lib/db'
import { caldavAccounts, calendars, events } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { eq, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { syncAccount } from '@/lib/caldav/sync'
import { buildVEvent, updateVEvent, parseVEvent } from '@/lib/caldav/ical-parser'
import { pushEvent, updateRemoteEvent, deleteRemoteEvent } from '@/lib/caldav/client'
import { tasks } from '@/db/schema'

// --- Types ---

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

type CaldavAccount = typeof caldavAccounts.$inferSelect
type Calendar = typeof calendars.$inferSelect
type Event = typeof events.$inferSelect

export type CalendarWithAccount = Calendar & { accountDisplayName: string }
export type EventWithCalendar = Event & { calendarColor: string; calendarName: string }

// --- Zod schemas ---

const createAccountSchema = z.object({
  serverUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  displayName: z.string().min(1).max(200),
})

const updateAccountSchema = z.object({
  id: z.string().uuid(),
  serverUrl: z.string().url().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  displayName: z.string().min(1).max(200).optional(),
})

const createEventSchema = z.object({
  calendarId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startAt: z.string(),
  endAt: z.string(),
  allDay: z.boolean().default(false),
})

const updateEventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  allDay: z.boolean().optional(),
})

// --- Server Actions ---

export async function createCaldavAccount(
  data: z.infer<typeof createAccountSchema>
): Promise<ActionResult<CaldavAccount>> {
  const parsed = createAccountSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const now = Date.now()
  const id = crypto.randomUUID()

  const [created] = db
    .insert(caldavAccounts)
    .values({
      id,
      serverUrl: parsed.data.serverUrl,
      username: parsed.data.username,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all()

  // Trigger initial sync
  try {
    await syncAccount(id)
  } catch {
    // Account created but sync failed - user can retry manually
  }

  revalidatePath('/calendar')
  revalidatePath('/calendar/settings')
  return { success: true, data: created }
}

export async function updateCaldavAccount(
  id: string,
  updates: Omit<z.infer<typeof updateAccountSchema>, 'id'>
): Promise<ActionResult<CaldavAccount>> {
  const parsed = updateAccountSchema.safeParse({ id, ...updates })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const existing = db
    .select()
    .from(caldavAccounts)
    .where(eq(caldavAccounts.id, parsed.data.id))
    .get()

  if (!existing) {
    return { success: false, error: 'Account not found' }
  }

  const setValues: Record<string, unknown> = { updatedAt: Date.now() }
  if (parsed.data.serverUrl !== undefined) setValues.serverUrl = parsed.data.serverUrl
  if (parsed.data.username !== undefined) setValues.username = parsed.data.username
  if (parsed.data.password !== undefined) setValues.password = parsed.data.password
  if (parsed.data.displayName !== undefined) setValues.displayName = parsed.data.displayName

  const [updated] = db
    .update(caldavAccounts)
    .set(setValues)
    .where(eq(caldavAccounts.id, parsed.data.id))
    .returning()
    .all()

  // Re-sync if credentials changed
  if (parsed.data.serverUrl || parsed.data.username || parsed.data.password) {
    try {
      await syncAccount(parsed.data.id)
    } catch {
      // Sync failed - user can retry manually
    }
  }

  revalidatePath('/calendar')
  revalidatePath('/calendar/settings')
  return { success: true, data: updated }
}

export async function deleteCaldavAccount(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) {
    return { success: false, error: 'Invalid account ID' }
  }

  const existing = db
    .select()
    .from(caldavAccounts)
    .where(eq(caldavAccounts.id, parsed.data))
    .get()

  if (!existing) {
    return { success: false, error: 'Account not found' }
  }

  // Cascade delete handles calendars and events via FK
  db.delete(caldavAccounts).where(eq(caldavAccounts.id, parsed.data)).run()

  revalidatePath('/calendar')
  revalidatePath('/calendar/settings')
  return { success: true, data: { id: parsed.data } }
}

export async function toggleCalendarEnabled(
  id: string
): Promise<ActionResult<Calendar>> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) {
    return { success: false, error: 'Invalid calendar ID' }
  }

  const cal = db
    .select()
    .from(calendars)
    .where(eq(calendars.id, parsed.data))
    .get()

  if (!cal) {
    return { success: false, error: 'Calendar not found' }
  }

  const [updated] = db
    .update(calendars)
    .set({ enabled: !cal.enabled, updatedAt: Date.now() })
    .where(eq(calendars.id, parsed.data))
    .returning()
    .all()

  revalidatePath('/calendar')
  revalidatePath('/calendar/settings')
  return { success: true, data: updated }
}

export async function triggerSync(
  accountId?: string
): Promise<ActionResult<{ synced: number; errors: string[] }>> {
  try {
    if (accountId) {
      const result = await syncAccount(accountId)
      revalidatePath('/calendar')
      return { success: true, data: result }
    }

    const { syncAllAccounts } = await import('@/lib/caldav/sync')
    const result = await syncAllAccounts()
    revalidatePath('/calendar')
    return { success: true, data: { synced: result.total, errors: result.errors } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Sync failed' }
  }
}

export async function getCalendars(): Promise<CalendarWithAccount[]> {
  const cals = db.select().from(calendars).all()
  const accounts = db.select().from(caldavAccounts).all()
  const accountMap = new Map(accounts.map(a => [a.id, a]))

  return cals.map(cal => ({
    ...cal,
    accountDisplayName: accountMap.get(cal.accountId)?.displayName ?? 'Unknown',
  }))
}

export async function getCaldavAccounts(): Promise<CaldavAccount[]> {
  return db.select().from(caldavAccounts).all()
}

export async function getEventsByDateRange(
  start: string,
  end: string
): Promise<{ events: EventWithCalendar[]; tasks: (typeof tasks.$inferSelect)[] }> {
  const cals = db.select().from(calendars).all()
  const enabledCalIds = new Set(cals.filter(c => c.enabled).map(c => c.id))
  const calMap = new Map(cals.map(c => [c.id, c]))

  const allEvents = db
    .select()
    .from(events)
    .where(and(lte(events.startAt, end), gte(events.endAt, start)))
    .all()

  const filteredEvents: EventWithCalendar[] = allEvents
    .filter(e => enabledCalIds.has(e.calendarId))
    .map(e => {
      const cal = calMap.get(e.calendarId)
      return {
        ...e,
        calendarColor: cal?.color ?? '#3b82f6',
        calendarName: cal?.displayName ?? 'Unknown',
      }
    })

  // Also get tasks in range
  const rangeTasks = db
    .select()
    .from(tasks)
    .where(and(gte(tasks.date, start), lte(tasks.date, end)))
    .all()

  return { events: filteredEvents, tasks: rangeTasks }
}

export async function createEvent(
  data: z.infer<typeof createEventSchema>
): Promise<ActionResult<Event>> {
  const parsed = createEventSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const cal = db
    .select()
    .from(calendars)
    .where(eq(calendars.id, parsed.data.calendarId))
    .get()

  if (!cal) {
    return { success: false, error: 'Calendar not found' }
  }

  const account = db
    .select()
    .from(caldavAccounts)
    .where(eq(caldavAccounts.id, cal.accountId))
    .get()

  if (!account) {
    return { success: false, error: 'Account not found' }
  }

  const uid = crypto.randomUUID()
  const rawIcal = buildVEvent({
    uid,
    title: parsed.data.title,
    description: parsed.data.description,
    location: parsed.data.location,
    startAt: parsed.data.startAt,
    endAt: parsed.data.endAt,
    allDay: parsed.data.allDay,
  })

  const filename = `${uid}.ics`
  let url = `${cal.url}${filename}`
  let etag: string | null = null

  try {
    const result = await pushEvent(
      { serverUrl: account.serverUrl, username: account.username, password: account.password },
      cal.url,
      filename,
      rawIcal,
    )
    url = result.url
    etag = result.etag
  } catch (err) {
    return { success: false, error: `Failed to push to server: ${err instanceof Error ? err.message : String(err)}` }
  }

  const now = Date.now()
  const [created] = db
    .insert(events)
    .values({
      id: crypto.randomUUID(),
      calendarId: parsed.data.calendarId,
      uid,
      etag,
      url,
      title: parsed.data.title,
      description: parsed.data.description ?? '',
      location: parsed.data.location ?? '',
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      allDay: parsed.data.allDay,
      status: 'confirmed',
      rawIcal,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all()

  revalidatePath('/calendar')
  return { success: true, data: created }
}

export async function updateEvent(
  id: string,
  changes: Omit<z.infer<typeof updateEventSchema>, 'id'>
): Promise<ActionResult<Event>> {
  const parsed = updateEventSchema.safeParse({ id, ...changes })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const event = db
    .select()
    .from(events)
    .where(eq(events.id, parsed.data.id))
    .get()

  if (!event) {
    return { success: false, error: 'Event not found' }
  }

  const cal = db
    .select()
    .from(calendars)
    .where(eq(calendars.id, event.calendarId))
    .get()

  const account = cal
    ? db.select().from(caldavAccounts).where(eq(caldavAccounts.id, cal.accountId)).get()
    : null

  // Update iCal
  const updatedIcal = updateVEvent(event.rawIcal, {
    title: parsed.data.title,
    description: parsed.data.description,
    location: parsed.data.location,
    startAt: parsed.data.startAt,
    endAt: parsed.data.endAt,
    allDay: parsed.data.allDay,
  })

  // Push to remote
  let newEtag = event.etag
  if (account && cal && event.url && event.etag) {
    try {
      const result = await updateRemoteEvent(
        { serverUrl: account.serverUrl, username: account.username, password: account.password },
        cal.url,
        event.url,
        updatedIcal,
        event.etag,
      )
      newEtag = result.etag ?? event.etag
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('412')) {
        return { success: false, error: 'Conflict: event was modified on the server. Please sync and try again.' }
      }
      return { success: false, error: `Failed to update on server: ${message}` }
    }
  }

  const parsedEvent = parseVEvent(updatedIcal)
  const now = Date.now()

  const [updated] = db
    .update(events)
    .set({
      title: parsedEvent?.title ?? event.title,
      description: parsedEvent?.description ?? event.description,
      location: parsedEvent?.location ?? event.location,
      startAt: parsedEvent?.startAt ?? event.startAt,
      endAt: parsedEvent?.endAt ?? event.endAt,
      allDay: parsedEvent?.allDay ?? event.allDay,
      etag: newEtag,
      rawIcal: updatedIcal,
      updatedAt: now,
    })
    .where(eq(events.id, parsed.data.id))
    .returning()
    .all()

  revalidatePath('/calendar')
  return { success: true, data: updated }
}

export async function deleteEvent(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) {
    return { success: false, error: 'Invalid event ID' }
  }

  const event = db
    .select()
    .from(events)
    .where(eq(events.id, parsed.data))
    .get()

  if (!event) {
    return { success: false, error: 'Event not found' }
  }

  const cal = db
    .select()
    .from(calendars)
    .where(eq(calendars.id, event.calendarId))
    .get()

  const account = cal
    ? db.select().from(caldavAccounts).where(eq(caldavAccounts.id, cal.accountId)).get()
    : null

  // Delete from remote
  if (account && event.url && event.etag) {
    try {
      await deleteRemoteEvent(
        { serverUrl: account.serverUrl, username: account.username, password: account.password },
        event.url,
        event.etag,
      )
    } catch (err) {
      return { success: false, error: `Failed to delete from server: ${err instanceof Error ? err.message : String(err)}` }
    }
  }

  db.delete(events).where(eq(events.id, parsed.data)).run()

  revalidatePath('/calendar')
  return { success: true, data: { id: parsed.data } }
}

export async function getEventById(
  id: string
): Promise<EventWithCalendar | undefined> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return undefined

  const event = db
    .select()
    .from(events)
    .where(eq(events.id, parsed.data))
    .get()

  if (!event) return undefined

  const cal = db
    .select()
    .from(calendars)
    .where(eq(calendars.id, event.calendarId))
    .get()

  return {
    ...event,
    calendarColor: cal?.color ?? '#3b82f6',
    calendarName: cal?.displayName ?? 'Unknown',
  }
}
