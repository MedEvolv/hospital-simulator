import { NextRequest, NextResponse } from 'next/server'
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  DEFAULT_AFTER_LOGIN,
  safeNextPath,
} from '@/lib/auth/config'
import {
  bumpChallengeAttempts,
  isValidEmail,
  normalizeEmail,
  readChallengeToken,
  verifyLocalOtp,
} from '@/lib/auth/otp'
import { getOtpProvider, verifySupabaseOtp } from '@/lib/auth/provider'
import { createSessionToken, sessionSecretConfigured } from '@/lib/auth/session'

function cookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  const otp = typeof body.otp === 'string' ? body.otp.trim() : ''
  const next = safeNextPath(typeof body.next === 'string' ? body.next : DEFAULT_AFTER_LOGIN)

  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ ok: false, error: 'Enter the email and the six-digit code.' }, { status: 400 })
  }

  const secret = process.env.OTP_SESSION_SECRET ?? ''
  if (!sessionSecretConfigured() || getOtpProvider() === 'none') {
    return NextResponse.json(
      { ok: false, configured: false, error: 'OTP not configured' },
      { status: 503 },
    )
  }

  const challenge = await readChallengeToken(req.cookies.get(CHALLENGE_COOKIE)?.value, secret)
  if (!challenge || challenge.email !== email) {
    return NextResponse.json({ ok: false, error: 'Request a new code.' }, { status: 401 })
  }

  let matched = false
  if (challenge.mode === 'local') {
    matched = await verifyLocalOtp(challenge, otp, secret)
  } else {
    matched = await verifySupabaseOtp(email, otp)
  }

  if (!matched) {
    const bumped = await bumpChallengeAttempts(challenge, secret)
    const res = NextResponse.json({ ok: false, error: 'That code did not match.' }, { status: 401 })
    if (bumped) {
      res.cookies.set(CHALLENGE_COOKIE, bumped, { ...cookieBase(), maxAge: 60 * 10 })
    } else {
      res.cookies.set(CHALLENGE_COOKIE, '', { ...cookieBase(), maxAge: 0 })
    }
    return res
  }

  const session = await createSessionToken(email, secret)
  const res = NextResponse.json({ ok: true, next })
  res.cookies.set(SESSION_COOKIE, session, { ...cookieBase(), maxAge: SESSION_TTL_SECONDS })
  res.cookies.set(CHALLENGE_COOKIE, '', { ...cookieBase(), maxAge: 0 })
  return res
}
