import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events, calendars } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { authenticateRequest } from '@/lib/caldav/server/auth'
import { computeEtag } from '@/lib/caldav/server/etag'
import { parseVEvent } from '@/lib/caldav/ical-parser'
import { DAV_HEADERS } from '@/lib/caldav/server/xml'

type RouteParams = {
  params: Promise<{ calendarId: string; eventUid: string }>
}

function stripIcsExtension(uid: string): string {
  return uid.endsWith('.ics') ? uid.slice(0, -4) : uid
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request)
  if (!auth.authenticated) return auth.response

  const { calendarId, eventUid } = await params
  const uid = stripIcsExtension(eventUid)

  const event = db
    .select()
    .from(events)
    .where(and(eq(events.calendarId, calendarId), eq(events.uid, uid)))
    .get()

  if (!event) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return new NextResponse(event.rawIcal, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'ETag': event.etag ?? '',
    },
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request)
  if (!auth.authenticated) return auth.response

  const { calendarId, eventUid } = await params
  const uid = stripIcsExtension(eventUid)

  const cal = db
    .select()
    .from(calendars)
    .where(and(eq(calendars.id, calendarId), eq(calendars.isLocal, true)))
    .get()

  if (!cal) {
    return new NextResponse('Calendar not found', { status: 404 })
  }

  const rawIcal = await request.text()
  const etag = computeEtag(rawIcal)
  const parsed = parseVEvent(rawIcal)

  const existing = db
    .select()
    .from(events)
    .where(and(eq(events.calendarId, calendarId), eq(events.uid, uid)))
    .get()

  const ifMatch = request.headers.get('If-Match')
  if (existing && ifMatch && existing.etag !== ifMatch.replace(/"/g, '').replace(/^W\//, '')) {
    return new NextResponse('Precondition Failed', { status: 412 })
  }

  const now = Date.now()

  if (existing) {
    db.update(events)
      .set({
        title: parsed?.title ?? existing.title,
        description: parsed?.description ?? existing.description,
        location: parsed?.location ?? existing.location,
        startAt: parsed?.startAt ?? existing.startAt,
        endAt: parsed?.endAt ?? existing.endAt,
        allDay: parsed?.allDay ?? existing.allDay,
        etag,
        rawIcal,
        updatedAt: now,
      })
      .where(eq(events.id, existing.id))
      .run()
  } else {
    db.insert(events)
      .values({
        id: crypto.randomUUID(),
        calendarId,
        uid,
        etag,
        url: `/api/caldav/calendars/${calendarId}/${uid}.ics`,
        title: parsed?.title ?? 'Untitled',
        description: parsed?.description ?? '',
        location: parsed?.location ?? '',
        startAt: parsed?.startAt ?? new Date().toISOString(),
        endAt: parsed?.endAt ?? new Date().toISOString(),
        allDay: parsed?.allDay ?? false,
        status: 'confirmed',
        rawIcal,
        createdAt: now,
        updatedAt: now,
      })
      .run()
  }

  // Update ctag
  db.update(calendars)
    .set({ ctag: String(now), updatedAt: now })
    .where(eq(calendars.id, calendarId))
    .run()

  return new NextResponse(null, {
    status: existing ? 204 : 201,
    headers: { ETag: etag },
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request)
  if (!auth.authenticated) return auth.response

  const { calendarId, eventUid } = await params
  const uid = stripIcsExtension(eventUid)

  const event = db
    .select()
    .from(events)
    .where(and(eq(events.calendarId, calendarId), eq(events.uid, uid)))
    .get()

  if (!event) {
    return new NextResponse('Not Found', { status: 404 })
  }

  db.delete(events).where(eq(events.id, event.id)).run()

  // Update ctag
  const now = Date.now()
  db.update(calendars)
    .set({ ctag: String(now), updatedAt: now })
    .where(eq(calendars.id, calendarId))
    .run()

  return new NextResponse(null, { status: 204 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: DAV_HEADERS,
  })
}
