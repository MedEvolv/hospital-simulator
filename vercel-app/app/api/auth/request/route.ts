import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COPY } from '@/lib/auth/access-types'
import { getAccessStatus } from '@/lib/auth/access-lookup'
import { CHALLENGE_COOKIE, OTP_TTL_SECONDS } from '@/lib/auth/config'
import { cookieBase } from '@/lib/auth/cookies'
import { createChallengeToken, generateOtp, isValidEmail, normalizeEmail } from '@/lib/auth/otp'
import { getOtpProvider, sendOtpEmail, sendSupabaseOtp } from '@/lib/auth/provider'
import { sessionSecretConfigured } from '@/lib/auth/session'

function deny(status: string, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, status, error, ...extra }, { status: 403 })
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

  const access = await getAccessStatus(email)
  if (access.status !== 'approved') {
    if (access.status === 'pending') {
      return deny('pending', ACCESS_COPY.received, { setup: access.setup })
    }
    if (access.status === 'denied' || access.status === 'revoked') {
      return deny(access.status, ACCESS_COPY.notOpened, { setup: access.setup })
    }
    return deny('unknown', access.setup ? ACCESS_COPY.setup : ACCESS_COPY.requestFirst, {
      setup: access.setup,
    })
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
