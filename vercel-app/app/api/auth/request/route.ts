import { NextRequest, NextResponse } from 'next/server'
import { CHALLENGE_COOKIE, SESSION_COOKIE, OTP_TTL_SECONDS } from '@/lib/auth/config'
import { createChallengeToken, generateOtp, isValidEmail, normalizeEmail } from '@/lib/auth/otp'
import { getOtpProvider, sendOtpEmail, sendSupabaseOtp } from '@/lib/auth/provider'
import { sessionSecretConfigured } from '@/lib/auth/session'

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

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })
  }

  const secret = process.env.OTP_SESSION_SECRET ?? ''
  const provider = getOtpProvider()

  if (!sessionSecretConfigured() || provider === 'none') {
    return NextResponse.json(
      { ok: false, configured: false, error: 'OTP not configured' },
      { status: 503 },
    )
  }

  try {
    if (provider === 'stub') {
      const otp = process.env.AUTH_OTP_STUB_CODE || generateOtp()
      const token = await createChallengeToken({ email, secret, mode: 'local', otp })
      const res = NextResponse.json({
        ok: true,
        configured: true,
        message: 'Enter the six-digit code.',
      })
      res.cookies.set(CHALLENGE_COOKIE, token, { ...cookieBase(), maxAge: OTP_TTL_SECONDS })
      return res
    }

    if (provider === 'resend') {
      const otp = generateOtp()
      const sent = await sendOtpEmail(email, otp)
      if (!sent.ok) {
        return NextResponse.json(
          { ok: false, configured: false, error: 'OTP not configured' },
          { status: 503 },
        )
      }
      const token = await createChallengeToken({ email, secret, mode: 'local', otp })
      const res = NextResponse.json({
        ok: true,
        configured: true,
        message: 'Enter the six-digit code we sent.',
      })
      res.cookies.set(CHALLENGE_COOKIE, token, { ...cookieBase(), maxAge: OTP_TTL_SECONDS })
      return res
    }

    const sent = await sendSupabaseOtp(email)
    if (!sent.ok) {
      return NextResponse.json(
        { ok: false, configured: false, error: 'OTP not configured' },
        { status: 503 },
      )
    }
    const token = await createChallengeToken({ email, secret, mode: 'supabase' })
    const res = NextResponse.json({
      ok: true,
      configured: true,
      message: 'Enter the six-digit code we sent.',
    })
    res.cookies.set(CHALLENGE_COOKIE, token, { ...cookieBase(), maxAge: OTP_TTL_SECONDS })
    return res
  } catch {
    return NextResponse.json(
      { ok: false, configured: false, error: 'OTP not configured' },
      { status: 503 },
    )
  }
}

export async function GET() {
  const configured = sessionSecretConfigured() && getOtpProvider() !== 'none'
  return NextResponse.json({ configured })
}
