import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/caldav/server/auth'
import { handleCalendarPropfind } from '@/lib/caldav/server/propfind'
import { handleCalendarQuery, handleCalendarMultiget } from '@/lib/caldav/server/report'
import { DAV_HEADERS } from '@/lib/caldav/server/xml'

type RouteParams = {
  params: Promise<{ calendarId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request)
  if (!auth.authenticated) return auth.response

  const { calendarId } = await params
  const originalMethod = request.headers.get('X-Original-Method') ?? 'POST'
  const body = await request.text()

  if (originalMethod === 'PROPFIND') {
    const depth = request.headers.get('Depth') ?? '0'
    const xml = handleCalendarPropfind(calendarId, depth)
    return new NextResponse(xml, {
      status: 207,
      headers: DAV_HEADERS,
    })
  }

  if (originalMethod === 'REPORT') {
    let xml: string

    if (body.includes('calendar-multiget')) {
      xml = handleCalendarMultiget(calendarId, body)
    } else {
      xml = handleCalendarQuery(calendarId, body)
    }

    return new NextResponse(xml, {
      status: 207,
      headers: DAV_HEADERS,
    })
  }

  return new NextResponse('Method not allowed', { status: 405 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: DAV_HEADERS,
  })
}
