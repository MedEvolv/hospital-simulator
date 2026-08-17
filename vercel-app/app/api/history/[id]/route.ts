/**
 * GET /api/history/:id
 *
 * Returns `{ ok, report }` for a run owned by the OTP user.
 * `report` is the results-page payload (fromSavedRun), not the raw row.
 * 401 without OTP. 404 if the row is missing or belongs to someone else.
 * 422 `incomplete_saved_run` for old `{ events }` rows (fail closed, no backfill).
 */

import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/config'
import { userIdFromOtpCookie } from '@/lib/auth/run-identity'
import { fetchRunForUserId } from '@/lib/auth/runs-db'
import { fromSavedRun } from '@/lib/domain/saved-run'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = await userIdFromOtpCookie(req.cookies.get(SESSION_COOKIE)?.value)
  if (!userId) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 })
  }

  const id = params.id
  if (!id) {
    return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
  }

  const run = await fetchRunForUserId(id, userId)
  if (!run?.run_data) {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  }

  const report = fromSavedRun(run.run_data)
  if (!report) {
    return NextResponse.json({ ok: false, error: 'incomplete_saved_run' }, { status: 422 })
  }

  return NextResponse.json({ ok: true, report })
}
