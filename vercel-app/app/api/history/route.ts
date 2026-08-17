/**
 * GET /api/history
 *
 * Lists the OTP user's saved runs. Identity is im_otp_session, not
 * supabase.auth.getSession(). 401 without a valid OTP cookie.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/config'
import { userIdFromOtpCookie } from '@/lib/auth/run-identity'
import { listRunsForUserId } from '@/lib/auth/runs-db'

export async function GET(req: NextRequest) {
  const userId = await userIdFromOtpCookie(req.cookies.get(SESSION_COOKIE)?.value)
  if (!userId) {
    return NextResponse.json({ ok: false, authenticated: false, runs: [] }, { status: 401 })
  }

  const runs = await listRunsForUserId(userId)
  return NextResponse.json({ ok: true, authenticated: true, runs })
}
