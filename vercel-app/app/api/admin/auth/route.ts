/**
 * POST /api/admin/auth
 * Body: { password: string }
 * Returns: { ok: true } on success, 401 on failure.
 *
 * The admin password is stored in ADMIN_PASSWORD env var.
 * We use a timing-safe comparison to prevent timing attacks.
 */

import { NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const supplied: string = body.password ?? ''
  const expected: string = process.env.ADMIN_PASSWORD ?? ''

  if (!expected) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
  }

  // Hash both sides so timingSafeEqual can receive equal-length buffers
  const a = createHash('sha256').update(supplied).digest()
  const b = createHash('sha256').update(expected).digest()

  if (timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
