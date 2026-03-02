import { db } from '@/lib/db'
import { calendars } from '@/db/schema'
import { eq } from 'drizzle-orm'

export function ensureLocalCalendar(): string {
  const existing = db
    .select()
    .from(calendars)
    .where(eq(calendars.isLocal, true))
    .get()

  if (existing) {
    return existing.id
  }

  const id = crypto.randomUUID()
  const now = Date.now()

  db.insert(calendars)
    .values({
      id,
      accountId: null,
      url: `/api/caldav/calendars/${id}/`,
      displayName: 'Lumina',
      color: '#3B82F6',
      ctag: String(now),
      isLocal: true,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    })
    .run()

  return id
}
