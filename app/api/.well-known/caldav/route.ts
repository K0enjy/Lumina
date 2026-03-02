import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.redirect(new URL('/api/caldav/', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'), 301)
}
