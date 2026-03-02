import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Intercept CalDAV-specific HTTP methods and convert to POST
  if (pathname.startsWith('/api/caldav') && (method === 'PROPFIND' || method === 'REPORT')) {
    const url = request.nextUrl.clone()
    const headers = new Headers(request.headers)
    headers.set('X-Original-Method', method)

    return NextResponse.rewrite(url, {
      request: {
        headers,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/caldav/:path*',
}
