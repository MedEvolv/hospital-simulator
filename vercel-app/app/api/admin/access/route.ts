import { NextRequest, NextResponse } from 'next/server'
import { ensureSeededAdminRows, listAccessRequests, setAccessStatus } from '@/lib/auth/access-db'
import { getAccessStatus, isEmailApproved } from '@/lib/auth/access-lookup'
import { isAdminEmail } from '@/lib/auth/admins'
import { SESSION_COOKIE } from '@/lib/auth/config'
import { clearAuthCookies } from '@/lib/auth/cookies'
import { normalizeEmail } from '@/lib/auth/otp'
import { readSessionToken } from '@/lib/auth/session'

async function requireAdmin(req: NextRequest) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return { error: NextResponse.json({ ok: false, error: 'Sign in first.' }, { status: 401 }) }
  }
  if (!(await isEmailApproved(session.email))) {
    const res = NextResponse.json({ ok: false, error: 'This email is not opened.' }, { status: 401 })
    clearAuthCookies(res)
    return { error: res }
  }
  if (!isAdminEmail(session.email)) {
    return { error: NextResponse.json({ ok: false, error: 'This queue is not opened for this email.' }, { status: 403 }) }
  }
  return { session }
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req)
  if (gate.error) return gate.error

  await ensureSeededAdminRows()
  const listed = await listAccessRequests()
  if (!listed.ok) {
    return NextResponse.json(
      { ok: false, setup: listed.setup, error: listed.error },
      { status: listed.setup ? 503 : 500 },
    )
  }
  return NextResponse.json({ ok: true, rows: listed.rows })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req)
  if (gate.error) return gate.error

  const body = await req.json().catch(() => ({}))
  const email = typeof body.work_email === 'string' ? normalizeEmail(body.work_email) : ''
  const action = body.action
  if (!email || (action !== 'approve' && action !== 'deny' && action !== 'revoke')) {
    return NextResponse.json({ ok: false, error: 'Choose approve, deny, or revoke for a work email.' }, { status: 400 })
  }

  const existing = await getAccessStatus(email)
  if (existing.status === 'unknown' && !existing.row) {
    return NextResponse.json({ ok: false, error: 'No request for that email.' }, { status: 404 })
  }

  const status = action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : 'revoked'
  const written = await setAccessStatus(
    email,
    status,
    typeof body.reason === 'string' ? body.reason : undefined,
  )
  if (!written.ok) {
    return NextResponse.json(
      { ok: false, setup: written.setup, error: written.error },
      { status: written.setup ? 503 : 500 },
    )
  }

  const res = NextResponse.json({ ok: true, row: written.row })
  if (status === 'revoked' && gate.session && gate.session.email === email) {
    clearAuthCookies(res)
  }
  return res
}
