import ICAL from 'ical.js'

type ParsedEvent = {
  uid: string
  title: string
  description: string
  location: string
  startAt: string
  endAt: string
  allDay: boolean
  status: 'confirmed' | 'tentative' | 'cancelled'
}

export function parseVEvent(rawIcal: string): ParsedEvent | null {
  const jcal = ICAL.parse(rawIcal)
  const comp = new ICAL.Component(jcal)
  const vevent = comp.getFirstSubcomponent('vevent')
  if (!vevent) return null

  const event = new ICAL.Event(vevent)
  const dtstart = vevent.getFirstPropertyValue('dtstart') as ICAL.Time | null
  const dtend = vevent.getFirstPropertyValue('dtend') as ICAL.Time | null

  if (!dtstart) return null

  const allDay = dtstart.isDate
  const startAt = allDay
    ? dtstart.toString()
    : dtstart.toJSDate().toISOString()

  let endAt: string
  if (dtend) {
    endAt = allDay ? dtend.toString() : dtend.toJSDate().toISOString()
  } else {
    endAt = startAt
  }

  const rawStatus = (vevent.getFirstPropertyValue('status') as string | null)?.toLowerCase()
  let status: ParsedEvent['status'] = 'confirmed'
  if (rawStatus === 'tentative') status = 'tentative'
  else if (rawStatus === 'cancelled') status = 'cancelled'

  return {
    uid: event.uid,
    title: event.summary || 'Untitled',
    description: event.description || '',
    location: event.location || '',
    startAt,
    endAt,
    allDay,
    status,
  }
}

type EventData = {
  uid: string
  title: string
  description?: string
  location?: string
  startAt: string
  endAt: string
  allDay: boolean
}

export function buildVEvent(data: EventData): string {
  const cal = new ICAL.Component(['vcalendar', [], []])
  cal.updatePropertyWithValue('prodid', '-//Lumina//CalDAV//EN')
  cal.updatePropertyWithValue('version', '2.0')

  const vevent = new ICAL.Component('vevent')
  vevent.updatePropertyWithValue('uid', data.uid)
  vevent.updatePropertyWithValue('summary', data.title)
  vevent.updatePropertyWithValue('dtstamp', ICAL.Time.now())

  if (data.description) {
    vevent.updatePropertyWithValue('description', data.description)
  }
  if (data.location) {
    vevent.updatePropertyWithValue('location', data.location)
  }

  if (data.allDay) {
    const start = ICAL.Time.fromDateString(data.startAt)
    start.isDate = true
    vevent.updatePropertyWithValue('dtstart', start)

    const end = ICAL.Time.fromDateString(data.endAt)
    end.isDate = true
    vevent.updatePropertyWithValue('dtend', end)
  } else {
    vevent.updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date(data.startAt), false))
    vevent.updatePropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date(data.endAt), false))
  }

  vevent.updatePropertyWithValue('status', 'CONFIRMED')
  cal.addSubcomponent(vevent)

  return cal.toString()
}

export function updateVEvent(rawIcal: string, changes: Partial<EventData>): string {
  const jcal = ICAL.parse(rawIcal)
  const comp = new ICAL.Component(jcal)
  const vevent = comp.getFirstSubcomponent('vevent')
  if (!vevent) throw new Error('No VEVENT found in iCal data')

  if (changes.title !== undefined) {
    vevent.updatePropertyWithValue('summary', changes.title)
  }
  if (changes.description !== undefined) {
    vevent.updatePropertyWithValue('description', changes.description)
  }
  if (changes.location !== undefined) {
    vevent.updatePropertyWithValue('location', changes.location)
  }

  if (changes.startAt !== undefined) {
    if (changes.allDay) {
      const start = ICAL.Time.fromDateString(changes.startAt)
      start.isDate = true
      vevent.updatePropertyWithValue('dtstart', start)
    } else {
      vevent.updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date(changes.startAt), false))
    }
  }

  if (changes.endAt !== undefined) {
    if (changes.allDay) {
      const end = ICAL.Time.fromDateString(changes.endAt)
      end.isDate = true
      vevent.updatePropertyWithValue('dtend', end)
    } else {
      vevent.updatePropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date(changes.endAt), false))
    }
  }

  vevent.updatePropertyWithValue('last-modified', ICAL.Time.now())
  vevent.updatePropertyWithValue('sequence',
    ((vevent.getFirstPropertyValue('sequence') as number | null) ?? 0) + 1
  )

  return comp.toString()
}
