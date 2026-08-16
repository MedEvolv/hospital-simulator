import { NextRequest, NextResponse } from 'next/server'
import { insertPendingRequest } from '@/lib/auth/access-db'
import { getAccessStatus } from '@/lib/auth/access-lookup'
import { ACCESS_COPY } from '@/lib/auth/access-types'
import { validateIntake } from '@/lib/auth/intake'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = validateIntake(body)
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
  }

  const existing = await getAccessStatus(parsed.value.work_email)
  if (existing.status === 'approved') {
    return NextResponse.json(
      { ok: false, status: 'approved', error: ACCESS_COPY.alreadyOpened },
      { status: 409 },
    )
  }
  if (existing.status === 'denied' || existing.status === 'revoked') {
    return NextResponse.json(
      { ok: false, status: existing.status, error: ACCESS_COPY.notOpened },
      { status: 403 },
    )
  }
  if (existing.status === 'pending' && existing.row) {
    return NextResponse.json({
      ok: true,
      status: 'pending',
      message: ACCESS_COPY.received,
    })
  }

  const written = await insertPendingRequest(parsed.value)
  if (!written.ok) {
    return NextResponse.json(
      { ok: false, setup: written.setup, error: written.setup ? ACCESS_COPY.setup : written.error },
      { status: written.setup ? 503 : 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    status: written.row.status,
    message: ACCESS_COPY.received,
  })
}
