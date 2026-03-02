export type AuthResult =
  | { authenticated: true; username: string }
  | { authenticated: false; response: Response }

export function authenticateRequest(request: Request): AuthResult {
  const username = process.env.CALDAV_USERNAME
  const password = process.env.CALDAV_PASSWORD

  if (!username || !password) {
    return { authenticated: false, response: new Response('CalDAV server not configured', { status: 503 }) }
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Basic ')) {
    return {
      authenticated: false,
      response: new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Lumina CalDAV"' },
      }),
    }
  }

  const decoded = atob(authHeader.slice(6))
  const colonIdx = decoded.indexOf(':')
  if (colonIdx === -1) {
    return {
      authenticated: false,
      response: new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Lumina CalDAV"' },
      }),
    }
  }

  const reqUser = decoded.slice(0, colonIdx)
  const reqPass = decoded.slice(colonIdx + 1)

  if (reqUser !== username || reqPass !== password) {
    return {
      authenticated: false,
      response: new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Lumina CalDAV"' },
      }),
    }
  }

  return { authenticated: true, username: reqUser }
}
