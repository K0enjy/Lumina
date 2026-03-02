import { db } from '@/lib/db'
import { events } from '@/db/schema'
import { eq, and, lte, gte } from 'drizzle-orm'
import {
  buildMultistatus,
  propGetetag,
  propCalendarData,
  propGetcontenttype,
} from './xml'

export function handleCalendarQuery(
  calendarId: string,
  body: string
): string {
  // Parse time-range from XML body if present
  const startMatch = body.match(/start="([^"]+)"/)
  const endMatch = body.match(/end="([^"]+)"/)

  let calEvents
  if (startMatch && endMatch) {
    const start = startMatch[1]
    const end = endMatch[1]
    calEvents = db
      .select()
      .from(events)
      .where(
        and(
          eq(events.calendarId, calendarId),
          lte(events.startAt, end),
          gte(events.endAt, start)
        )
      )
      .all()
  } else {
    calEvents = db
      .select()
      .from(events)
      .where(eq(events.calendarId, calendarId))
      .all()
  }

  const wantsData = body.includes('calendar-data')

  const responses = calEvents.map((event) => ({
    href: `/api/caldav/calendars/${calendarId}/${event.uid}.ics`,
    status: 'HTTP/1.1 200 OK',
    props: [
      propGetetag(event.etag ?? ''),
      propGetcontenttype('text/calendar; charset=utf-8; component=VEVENT'),
      ...(wantsData ? [propCalendarData(event.rawIcal)] : []),
    ].join('\n'),
  }))

  return buildMultistatus(responses)
}

export function handleCalendarMultiget(
  calendarId: string,
  body: string
): string {
  // Extract hrefs from the multiget request
  const hrefRegex = /<d:href>([^<]+)<\/d:href>/g
  const hrefs: string[] = []
  let match
  while ((match = hrefRegex.exec(body)) !== null) {
    hrefs.push(match[1])
  }

  // Also try without namespace prefix
  const hrefRegex2 = /<href>([^<]+)<\/href>/g
  while ((match = hrefRegex2.exec(body)) !== null) {
    hrefs.push(match[1])
  }

  // Extract UIDs from hrefs
  const uids = hrefs
    .map((href) => {
      const uidMatch = href.match(/\/([^/]+)\.ics$/)
      return uidMatch ? uidMatch[1] : null
    })
    .filter((uid): uid is string => uid !== null)

  const calEvents = db
    .select()
    .from(events)
    .where(eq(events.calendarId, calendarId))
    .all()
    .filter((e) => uids.includes(e.uid))

  const responses = calEvents.map((event) => ({
    href: `/api/caldav/calendars/${calendarId}/${event.uid}.ics`,
    status: 'HTTP/1.1 200 OK',
    props: [
      propGetetag(event.etag ?? ''),
      propGetcontenttype('text/calendar; charset=utf-8; component=VEVENT'),
      propCalendarData(event.rawIcal),
    ].join('\n'),
  }))

  return buildMultistatus(responses)
}
