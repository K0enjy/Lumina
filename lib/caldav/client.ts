import { createDAVClient, type DAVCalendar, type DAVObject } from 'tsdav'

type DAVClientConfig = {
  serverUrl: string
  username: string
  password: string
}

type RemoteCalendar = {
  url: string
  displayName: string
  color: string | null
  ctag: string | null
  syncToken: string | null
}

type RemoteEvent = {
  url: string
  etag: string
  rawIcal: string
}

export async function createClient(config: DAVClientConfig) {
  const client = await createDAVClient({
    serverUrl: config.serverUrl,
    credentials: {
      username: config.username,
      password: config.password,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  })
  return client
}

export async function fetchRemoteCalendars(config: DAVClientConfig): Promise<RemoteCalendar[]> {
  const client = await createClient(config)
  const calendars = await client.fetchCalendars()

  return calendars.map((cal: DAVCalendar) => ({
    url: cal.url,
    displayName: (typeof cal.displayName === 'string' ? cal.displayName : null) ?? 'Unnamed',
    color: (cal.components as Record<string, unknown> | undefined)?.['calendar-color'] as string | null ?? null,
    ctag: cal.ctag ?? null,
    syncToken: cal.syncToken ?? null,
  }))
}

export async function fetchRemoteEvents(
  config: DAVClientConfig,
  calendarUrl: string,
  syncToken?: string | null,
): Promise<{ events: RemoteEvent[]; syncToken: string | null }> {
  const client = await createClient(config)

  const calendars = await client.fetchCalendars()
  const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl)
  if (!calendar) throw new Error(`Calendar not found: ${calendarUrl}`)

  if (syncToken) {
    try {
      const result = await client.smartCollectionSync({
        collection: { ...calendar, syncToken },
        method: 'webdav',
      })
      const davObjects = (result.objects ?? []) as DAVObject[]
      return {
        events: davObjects
          .filter((obj: DAVObject) => obj.data)
          .map((obj: DAVObject) => ({
            url: obj.url,
            etag: obj.etag ?? '',
            rawIcal: obj.data as string,
          })),
        syncToken: result.syncToken ?? null,
      }
    } catch {
      // Fallback to full fetch if sync token is invalid
    }
  }

  const objects = await client.fetchCalendarObjects({ calendar })
  return {
    events: objects
      .filter((obj: DAVObject) => obj.data)
      .map((obj: DAVObject) => ({
        url: obj.url,
        etag: obj.etag ?? '',
        rawIcal: obj.data as string,
      })),
    syncToken: calendar.syncToken ?? null,
  }
}

export async function pushEvent(
  config: DAVClientConfig,
  calendarUrl: string,
  filename: string,
  rawIcal: string,
): Promise<{ url: string; etag: string | null }> {
  const client = await createClient(config)
  const calendars = await client.fetchCalendars()
  const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl)
  if (!calendar) throw new Error(`Calendar not found: ${calendarUrl}`)

  const response = await client.createCalendarObject({
    calendar,
    filename,
    iCalString: rawIcal,
  })

  const etag = response.headers?.get('etag') ?? null

  return {
    url: `${calendarUrl}${filename}`,
    etag,
  }
}

export async function updateRemoteEvent(
  config: DAVClientConfig,
  calendarUrl: string,
  eventUrl: string,
  rawIcal: string,
  etag: string,
): Promise<{ etag: string | null }> {
  const client = await createClient(config)
  const calendars = await client.fetchCalendars()
  const calendar = calendars.find((c: DAVCalendar) => c.url === calendarUrl)
  if (!calendar) throw new Error(`Calendar not found: ${calendarUrl}`)

  const response = await client.updateCalendarObject({
    calendarObject: {
      url: eventUrl,
      data: rawIcal,
      etag,
    },
  })

  return {
    etag: response.headers?.get('etag') ?? null,
  }
}

export async function deleteRemoteEvent(
  config: DAVClientConfig,
  eventUrl: string,
  etag: string,
): Promise<void> {
  const client = await createClient(config)
  await client.deleteCalendarObject({
    calendarObject: {
      url: eventUrl,
      etag,
    },
  })
}
