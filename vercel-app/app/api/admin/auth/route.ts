/**
 * POST /api/admin/auth
 * Body: { password: string }
 * Returns: { ok: true } on success, 401 on failure, 503 if unset/short.
 *
 * Empty ADMIN_PASSWORD fails closed. OTP admin email is required too.
 * This is not the only door; learning APIs also require the session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { isAdminEmail } from '@/lib/auth/admins'
import { configuredAdminPassword } from '@/lib/auth/admin-gate'
import { SESSION_COOKIE } from '@/lib/auth/config'
import { readSessionToken } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expected = configuredAdminPassword()
  if (!expected) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const supplied: string = body.password ?? ''

  const a = createHash('sha256').update(supplied).digest()
  const b = createHash('sha256').update(expected).digest()

  if (timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
