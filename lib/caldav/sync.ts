import { db } from '@/lib/db'
import { caldavAccounts, calendars, events } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { fetchRemoteCalendars, fetchRemoteEvents } from './client'
import { parseVEvent } from './ical-parser'

export async function syncAccount(accountId: string): Promise<{ synced: number; errors: string[] }> {
  const account = db
    .select()
    .from(caldavAccounts)
    .where(eq(caldavAccounts.id, accountId))
    .get()

  if (!account) throw new Error('Account not found')

  const config = {
    serverUrl: account.serverUrl,
    username: account.username,
    password: account.password,
  }

  const errors: string[] = []
  let totalSynced = 0

  // Sync calendars
  const remoteCalendars = await fetchRemoteCalendars(config)
  const localCalendars = db
    .select()
    .from(calendars)
    .where(eq(calendars.accountId, accountId))
    .all()

  const remoteUrls = new Set(remoteCalendars.map(c => c.url))
  const localUrlMap = new Map(localCalendars.map(c => [c.url, c]))

  // Upsert calendars
  const now = Date.now()
  for (const remote of remoteCalendars) {
    const existing = localUrlMap.get(remote.url)
    if (existing) {
      db.update(calendars)
        .set({
          displayName: remote.displayName,
          color: remote.color ?? existing.color,
          ctag: remote.ctag,
          syncToken: remote.syncToken,
          updatedAt: now,
        })
        .where(eq(calendars.id, existing.id))
        .run()
    } else {
      db.insert(calendars)
        .values({
          id: crypto.randomUUID(),
          accountId,
          url: remote.url,
          displayName: remote.displayName,
          color: remote.color ?? '#3b82f6',
          ctag: remote.ctag,
          syncToken: remote.syncToken,
          enabled: true,
          createdAt: now,
          updatedAt: now,
        })
        .run()
    }
  }

  // Remove calendars that no longer exist remotely
  for (const local of localCalendars) {
    if (!remoteUrls.has(local.url)) {
      db.delete(calendars).where(eq(calendars.id, local.id)).run()
    }
  }

  // Sync events for each enabled calendar
  const enabledCalendars = db
    .select()
    .from(calendars)
    .where(eq(calendars.accountId, accountId))
    .all()
    .filter(c => c.enabled)

  for (const cal of enabledCalendars) {
    try {
      const { events: remoteEvents, syncToken } = await fetchRemoteEvents(
        config,
        cal.url,
        cal.syncToken,
      )

      const localEvents = db
        .select()
        .from(events)
        .where(eq(events.calendarId, cal.id))
        .all()
      const localUidMap = new Map(localEvents.map(e => [e.uid, e]))
      const remoteUids = new Set<string>()

      for (const remote of remoteEvents) {
        const parsed = parseVEvent(remote.rawIcal)
        if (!parsed) continue

        remoteUids.add(parsed.uid)
        const existing = localUidMap.get(parsed.uid)

        if (existing) {
          if (existing.etag !== remote.etag) {
            db.update(events)
              .set({
                etag: remote.etag,
                url: remote.url,
                title: parsed.title,
                description: parsed.description,
                location: parsed.location,
                startAt: parsed.startAt,
                endAt: parsed.endAt,
                allDay: parsed.allDay,
                status: parsed.status,
                rawIcal: remote.rawIcal,
                updatedAt: now,
              })
              .where(eq(events.id, existing.id))
              .run()
          }
        } else {
          db.insert(events)
            .values({
              id: crypto.randomUUID(),
              calendarId: cal.id,
              uid: parsed.uid,
              etag: remote.etag,
              url: remote.url,
              title: parsed.title,
              description: parsed.description,
              location: parsed.location,
              startAt: parsed.startAt,
              endAt: parsed.endAt,
              allDay: parsed.allDay,
              status: parsed.status,
              rawIcal: remote.rawIcal,
              createdAt: now,
              updatedAt: now,
            })
            .run()
          totalSynced++
        }
      }

      // If we did a full fetch (not incremental), remove events no longer on server
      if (!cal.syncToken && remoteUids.size > 0) {
        for (const local of localEvents) {
          if (!remoteUids.has(local.uid)) {
            db.delete(events).where(eq(events.id, local.id)).run()
          }
        }
      }

      // Update calendar sync token
      if (syncToken) {
        db.update(calendars)
          .set({ syncToken, updatedAt: now })
          .where(eq(calendars.id, cal.id))
          .run()
      }
    } catch (err) {
      errors.push(`Calendar "${cal.displayName}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Update account lastSyncAt
  db.update(caldavAccounts)
    .set({ lastSyncAt: now, updatedAt: now })
    .where(eq(caldavAccounts.id, accountId))
    .run()

  return { synced: totalSynced, errors }
}

export async function syncAllAccounts(): Promise<{ total: number; errors: string[] }> {
  const accounts = db.select().from(caldavAccounts).all()
  let total = 0
  const allErrors: string[] = []

  for (const account of accounts) {
    try {
      const result = await syncAccount(account.id)
      total += result.synced
      allErrors.push(...result.errors)
    } catch (err) {
      allErrors.push(`Account "${account.displayName}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { total, errors: allErrors }
}
