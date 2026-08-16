import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/config'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { decideAuth } from '@/lib/auth/gate'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0]

  if (hostname === 'sandbox-v2.archlife.in') {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.host = 'mirror.archlife.in'
    return NextResponse.redirect(url, 308)
  }

  const decision = await decideAuth({
    pathname: request.nextUrl.pathname,
    sessionCookie: request.cookies.get(SESSION_COOKIE)?.value,
    secret: process.env.OTP_SESSION_SECRET ?? '',
  })

  if (decision.type === 'redirect') {
    const res = NextResponse.redirect(new URL(decision.location, request.url))
    if (decision.clearSession) {
      clearAuthCookies(res)
    }
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
