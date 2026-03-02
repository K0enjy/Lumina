import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/caldav/server/auth'
import { handlePrincipalPropfind } from '@/lib/caldav/server/propfind'
import { DAV_HEADERS } from '@/lib/caldav/server/xml'

export async function POST(request: NextRequest) {
  const originalMethod = request.headers.get('X-Original-Method') ?? 'POST'

  if (originalMethod === 'PROPFIND') {
    const auth = authenticateRequest(request)
    if (!auth.authenticated) return auth.response

    const xml = handlePrincipalPropfind()
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
