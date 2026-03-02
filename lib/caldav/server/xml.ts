type PropResponse = {
  href: string
  status: string
  props: string
}

export function buildMultistatus(responses: PropResponse[]): string {
  const items = responses
    .map(
      (r) => `<d:response>
<d:href>${escapeXml(r.href)}</d:href>
<d:propstat>
<d:prop>${r.props}</d:prop>
<d:status>${r.status}</d:status>
</d:propstat>
</d:response>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:c="urn:ietf:params:xml:ns:caldav">
${items}
</d:multistatus>`
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function propResourceType(types: string[]): string {
  const inner = types.map((t) => `<d:${t}/>`).join('')
  return `<d:resourcetype>${inner}</d:resourcetype>`
}

export function propCalendarResourceType(): string {
  return `<d:resourcetype><d:collection/><c:calendar/></d:resourcetype>`
}

export function propDisplayName(name: string): string {
  return `<d:displayname>${escapeXml(name)}</d:displayname>`
}

export function propCalendarColor(color: string): string {
  return `<x:calendar-color xmlns:x="http://apple.com/ns/ical/">${escapeXml(color)}</x:calendar-color>`
}

export function propGetctag(ctag: string): string {
  return `<cs:getctag>${escapeXml(ctag)}</cs:getctag>`
}

export function propGetetag(etag: string): string {
  return `<d:getetag>${escapeXml(etag)}</d:getetag>`
}

export function propSupportedCalendarComponentSet(): string {
  return `<c:supported-calendar-component-set><c:comp name="VEVENT"/></c:supported-calendar-component-set>`
}

export function propCurrentUserPrincipal(href: string): string {
  return `<d:current-user-principal><d:href>${escapeXml(href)}</d:href></d:current-user-principal>`
}

export function propCalendarHomeSet(href: string): string {
  return `<c:calendar-home-set><d:href>${escapeXml(href)}</d:href></c:calendar-home-set>`
}

export function propGetcontenttype(type: string): string {
  return `<d:getcontenttype>${escapeXml(type)}</d:getcontenttype>`
}

export function propCalendarData(ical: string): string {
  return `<c:calendar-data>${escapeXml(ical)}</c:calendar-data>`
}

export const DAV_HEADERS = {
  'DAV': '1, 2, calendar-access',
  'Allow': 'OPTIONS, PROPFIND, REPORT, GET, PUT, DELETE',
  'Content-Type': 'application/xml; charset=utf-8',
}
