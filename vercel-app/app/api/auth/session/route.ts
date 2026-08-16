import { NextRequest, NextResponse } from 'next/server'
import { isEmailApproved } from '@/lib/auth/access-lookup'
import { SESSION_COOKIE } from '@/lib/auth/config'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { readSessionToken } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 })
  }
  if (!(await isEmailApproved(session.email))) {
    const res = NextResponse.json({ ok: false, authenticated: false }, { status: 401 })
    clearAuthCookies(res)
    return res
  }
  return NextResponse.json({ ok: true, authenticated: true, email: session.email })
}
