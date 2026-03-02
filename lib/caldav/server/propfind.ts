import { db } from '@/lib/db'
import { calendars, events } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  buildMultistatus,
  propResourceType,
  propCalendarResourceType,
  propDisplayName,
  propCalendarColor,
  propGetctag,
  propGetetag,
  propSupportedCalendarComponentSet,
  propCurrentUserPrincipal,
  propCalendarHomeSet,
  propGetcontenttype,
} from './xml'

export function handlePrincipalPropfind(): string {
  return buildMultistatus([
    {
      href: '/api/caldav/',
      status: 'HTTP/1.1 200 OK',
      props: [
        propResourceType(['collection']),
        propCurrentUserPrincipal('/api/caldav/'),
        propCalendarHomeSet('/api/caldav/calendars/'),
        propDisplayName('Lumina'),
      ].join('\n'),
    },
  ])
}

export function handleCalendarHomePropfind(): string {
  const localCals = db
    .select()
    .from(calendars)
    .where(eq(calendars.isLocal, true))
    .all()

  const responses = [
    {
      href: '/api/caldav/calendars/',
      status: 'HTTP/1.1 200 OK',
      props: [
        propResourceType(['collection']),
        propDisplayName('Calendars'),
      ].join('\n'),
    },
    ...localCals.map((cal) => ({
      href: `/api/caldav/calendars/${cal.id}/`,
      status: 'HTTP/1.1 200 OK',
      props: [
        propCalendarResourceType(),
        propDisplayName(cal.displayName),
        propCalendarColor(cal.color ?? '#3b82f6'),
        propGetctag(cal.ctag ?? '0'),
        propSupportedCalendarComponentSet(),
      ].join('\n'),
    })),
  ]

  return buildMultistatus(responses)
}

export function handleCalendarPropfind(calendarId: string, depth: string): string {
  const cal = db
    .select()
    .from(calendars)
    .where(eq(calendars.id, calendarId))
    .get()

  if (!cal || !cal.isLocal) {
    return buildMultistatus([
      {
        href: `/api/caldav/calendars/${calendarId}/`,
        status: 'HTTP/1.1 404 Not Found',
        props: '',
      },
    ])
  }

  const responses = [
    {
      href: `/api/caldav/calendars/${cal.id}/`,
      status: 'HTTP/1.1 200 OK',
      props: [
        propCalendarResourceType(),
        propDisplayName(cal.displayName),
        propCalendarColor(cal.color ?? '#3b82f6'),
        propGetctag(cal.ctag ?? '0'),
        propSupportedCalendarComponentSet(),
      ].join('\n'),
    },
  ]

  // Depth 1: include events
  if (depth === '1') {
    const calEvents = db
      .select()
      .from(events)
      .where(eq(events.calendarId, calendarId))
      .all()

    for (const event of calEvents) {
      responses.push({
        href: `/api/caldav/calendars/${calendarId}/${event.uid}.ics`,
        status: 'HTTP/1.1 200 OK',
        props: [
          propGetetag(event.etag ?? ''),
          propGetcontenttype('text/calendar; charset=utf-8; component=VEVENT'),
        ].join('\n'),
      })
    }
  }

  return buildMultistatus(responses)
}
