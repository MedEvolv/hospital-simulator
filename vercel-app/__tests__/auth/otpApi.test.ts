/**
 * Auth API route tests. Stub provider only. No live SMS or Resend.
 */

import { POST as requestOtp, GET as requestStatus } from '@/app/api/auth/request/route'
import { POST as verifyOtp } from '@/app/api/auth/verify/route'
import { NextRequest } from 'next/server'

const SECRET = 'test-otp-session-secret-32chars-min'
const STUB_CODE = '246801'

function jsonRequest(url: string, body: object, cookie?: string): NextRequest {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (cookie) headers.set('cookie', cookie)
  return new NextRequest(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('OTP request/verify API', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it('fails closed when the provider is unset', async () => {
    process.env.OTP_SESSION_SECRET = SECRET
    delete process.env.AUTH_OTP_STUB
    delete process.env.RESEND_API_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const status = await requestStatus()
    const statusBody = await status.json()
    expect(statusBody.configured).toBe(false)

    const res = await requestOtp(jsonRequest('http://localhost/api/auth/request', { email: 'doc@hospital.in' }))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('OTP not configured')
  })

  it('verifies a stub OTP and sets an httpOnly session cookie', async () => {
    process.env.OTP_SESSION_SECRET = SECRET
    process.env.AUTH_OTP_STUB = '1'
    process.env.AUTH_OTP_STUB_CODE = STUB_CODE
    delete process.env.RESEND_API_KEY

    const requested = await requestOtp(jsonRequest('http://localhost/api/auth/request', { email: 'doc@hospital.in' }))
    expect(requested.status).toBe(200)
    const setCookie = requested.headers.get('set-cookie') || ''
    expect(setCookie).toMatch(/im_otp_challenge=/)
    expect(setCookie.toLowerCase()).toMatch(/httponly/)
    const challengeCookie = setCookie.split(';')[0]

    const verified = await verifyOtp(
      jsonRequest(
        'http://localhost/api/auth/verify',
        { email: 'doc@hospital.in', otp: STUB_CODE, next: '/home' },
        challengeCookie,
      ),
    )
    expect(verified.status).toBe(200)
    const verifiedBody = await verified.json()
    expect(verifiedBody.next).toBe('/home')
    const sessionCookie = verified.headers.get('set-cookie') || ''
    expect(sessionCookie).toMatch(/im_otp_session=/)
    expect(sessionCookie.toLowerCase()).toMatch(/httponly/)
  })
})
