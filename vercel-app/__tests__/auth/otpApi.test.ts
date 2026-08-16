/**
 * Auth API route tests. Stub provider only. No live SMS or Resend.
 */

import { POST as requestOtp, GET as requestStatus } from '@/app/api/auth/request/route'
import { POST as verifyOtp } from '@/app/api/auth/verify/route'
import { POST as submitIntake } from '@/app/api/access/request/route'
import { GET as adminGet, POST as adminPost } from '@/app/api/admin/access/route'
import { approvedStubRow, putMemoryAccess, resetMemoryAccess } from '@/lib/auth/access-memory'
import { ACCESS_COPY } from '@/lib/auth/access-types'
import { normalizeLinkedInUrl, validateIntake } from '@/lib/auth/intake'
import { createSessionToken } from '@/lib/auth/session'
import { NextRequest } from 'next/server'

const SECRET = 'test-otp-session-secret-32chars-min'
const STUB_CODE = '246801'
const APPROVED = 'approved@lab.in'
const PENDING = 'pending@lab.in'
const UNKNOWN = 'stranger@hospital.in'
const ADMIN = 'dr.ishaan@medevolv.in'
const NON_ADMIN = 'approved@lab.in'

function jsonRequest(url: string, body: object, cookie?: string): NextRequest {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (cookie) headers.set('cookie', cookie)
  return new NextRequest(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function getRequest(url: string, cookie?: string): NextRequest {
  const headers = new Headers()
  if (cookie) headers.set('cookie', cookie)
  return new NextRequest(url, { method: 'GET', headers })
}

const validIntake = {
  full_name: 'Priya Sharma',
  work_email: 'priya@lab.in',
  role: 'Lab owner',
  organisation: 'City Diagnostics',
  organisation_type: 'lab',
  city: 'Pune',
  linkedin_url: 'https://www.linkedin.com/in/priya-sharma',
  mirror_for: ['DPDP', 'NABH'],
  use_sentence: 'Rehearse follow-up after a synthetic report upload.',
  attest_rehearsal_only: true,
  attest_not_certification: true,
  attest_authorised: true,
  contact_ok: true,
}

describe('OTP request/verify API', () => {
  const env = { ...process.env }

  beforeEach(() => {
    resetMemoryAccess()
    process.env = { ...env }
    process.env.ACCESS_STORE = 'memory'
    process.env.OTP_SESSION_SECRET = SECRET
    delete process.env.MIRROR_ADMIN_EMAILS
  })

  afterEach(() => {
    process.env = { ...env }
    resetMemoryAccess()
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

  it('does not send a code for an unknown email', async () => {
    process.env.AUTH_OTP_STUB = '1'
    process.env.AUTH_OTP_STUB_CODE = STUB_CODE
    delete process.env.RESEND_API_KEY
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    const res = await requestOtp(jsonRequest('http://localhost/api/auth/request', { email: UNKNOWN }))
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.status).toBe('unknown')
    expect(body.error).toBe(ACCESS_COPY.requestFirst)
    expect(res.headers.get('set-cookie') || '').not.toMatch(/im_otp_challenge=/)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('does not send a code for a pending email', async () => {
    process.env.AUTH_OTP_STUB = '1'
    process.env.AUTH_OTP_STUB_CODE = STUB_CODE
    putMemoryAccess(approvedStubRow(PENDING, { status: 'pending', approved_at: null }))
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    const res = await requestOtp(jsonRequest('http://localhost/api/auth/request', { email: PENDING }))
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.status).toBe('pending')
    expect(body.error).toBe(ACCESS_COPY.received)
    expect(res.headers.get('set-cookie') || '').not.toMatch(/im_otp_challenge=/)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('does not call Supabase OTP for an unknown email when the supabase provider is configured', async () => {
    delete process.env.AUTH_OTP_STUB
    delete process.env.RESEND_API_KEY
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key'
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    const res = await requestOtp(jsonRequest('http://localhost/api/auth/request', { email: UNKNOWN }))
    expect(res.status).toBe(403)
    const otpCalls = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/auth/v1/otp'))
    expect(otpCalls).toHaveLength(0)
    fetchSpy.mockRestore()
  })

  it('verifies a stub OTP for an approved email and sets an httpOnly session cookie', async () => {
    process.env.AUTH_OTP_STUB = '1'
    process.env.AUTH_OTP_STUB_CODE = STUB_CODE
    delete process.env.RESEND_API_KEY
    putMemoryAccess(approvedStubRow(APPROVED))

    const requested = await requestOtp(jsonRequest('http://localhost/api/auth/request', { email: APPROVED }))
    expect(requested.status).toBe(200)
    const setCookie = requested.headers.get('set-cookie') || ''
    expect(setCookie).toMatch(/im_otp_challenge=/)
    expect(setCookie.toLowerCase()).toMatch(/httponly/)
    const challengeCookie = setCookie.split(';')[0]

    const verified = await verifyOtp(
      jsonRequest(
        'http://localhost/api/auth/verify',
        { email: APPROVED, otp: STUB_CODE, next: '/home' },
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

describe('intake validation', () => {
  it('rejects a request missing the three ticks', () => {
    const parsed = validateIntake({
      ...validIntake,
      attest_rehearsal_only: false,
    })
    expect(parsed.ok).toBe(false)
  })

  it('rejects a request missing the contact tick', () => {
    const parsed = validateIntake({
      ...validIntake,
      contact_ok: false,
    })
    expect(parsed.ok).toBe(false)
  })

  it('rejects a request with no Mirror-for chip', () => {
    const parsed = validateIntake({
      ...validIntake,
      mirror_for: [],
    })
    expect(parsed.ok).toBe(false)
  })

  it('rejects a non-LinkedIn URL', () => {
    expect(normalizeLinkedInUrl('https://example.com/in/priya')).toBeNull()
    const parsed = validateIntake({
      ...validIntake,
      linkedin_url: 'https://example.com/priya',
    })
    expect(parsed.ok).toBe(false)
  })

  it('accepts a LinkedIn profile or company URL', () => {
    expect(normalizeLinkedInUrl('linkedin.com/in/priya-sharma')).toBe('https://www.linkedin.com/in/priya-sharma')
    expect(normalizeLinkedInUrl('https://www.linkedin.com/company/city-diagnostics')).toBe(
      'https://www.linkedin.com/company/city-diagnostics',
    )
  })

  it('accepts the Must payload', () => {
    const parsed = validateIntake(validIntake)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.work_email).toBe('priya@lab.in')
      expect(parsed.value.linkedin_url).toBe('https://www.linkedin.com/in/priya-sharma')
      expect(parsed.value.contact_ok).toBe(true)
      expect(parsed.value.mirror_for).toEqual(['DPDP', 'NABH'])
    }
  })
})

describe('intake API', () => {
  const env = { ...process.env }

  beforeEach(() => {
    resetMemoryAccess()
    process.env = { ...env, ACCESS_STORE: 'memory' }
  })

  afterEach(() => {
    process.env = { ...env }
    resetMemoryAccess()
  })

  it('stores a pending request and never treats that as OTP send', async () => {
    const res = await submitIntake(jsonRequest('http://localhost/api/access/request', validIntake))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.message).toBe(ACCESS_COPY.received)
    expect(body.status).toBe('pending')

    process.env.AUTH_OTP_STUB = '1'
    process.env.OTP_SESSION_SECRET = SECRET
    const otp = await requestOtp(jsonRequest('http://localhost/api/auth/request', { email: validIntake.work_email }))
    expect(otp.status).toBe(403)
    expect((await otp.json()).status).toBe('pending')
  })

  it('rejects intake without a name', async () => {
    const res = await submitIntake(
      jsonRequest('http://localhost/api/access/request', { ...validIntake, full_name: '' }),
    )
    expect(res.status).toBe(400)
  })
})

describe('admin access queue', () => {
  const env = { ...process.env }

  beforeEach(() => {
    resetMemoryAccess()
    process.env = { ...env, ACCESS_STORE: 'memory', OTP_SESSION_SECRET: SECRET }
    delete process.env.MIRROR_ADMIN_EMAILS
    putMemoryAccess(approvedStubRow(NON_ADMIN))
  })

  afterEach(() => {
    process.env = { ...env }
    resetMemoryAccess()
  })

  it('forbids a signed-in non-admin', async () => {
    const cookie = `im_otp_session=${await createSessionToken(NON_ADMIN, SECRET)}`
    const res = await adminGet(getRequest('http://localhost/api/admin/access', cookie))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/not opened/)
  })

  it('forbids an unauthenticated caller', async () => {
    const res = await adminGet(getRequest('http://localhost/api/admin/access'))
    expect(res.status).toBe(401)
  })

  it('lets a seeded admin approve a pending row', async () => {
    putMemoryAccess(approvedStubRow(PENDING, { status: 'pending', approved_at: null }))
    const cookie = `im_otp_session=${await createSessionToken(ADMIN, SECRET)}`
    const listed = await adminGet(getRequest('http://localhost/api/admin/access', cookie))
    expect(listed.status).toBe(200)
    const approved = await adminPost(
      jsonRequest('http://localhost/api/admin/access', { work_email: PENDING, action: 'approve' }, cookie),
    )
    expect(approved.status).toBe(200)
    expect((await approved.json()).row.status).toBe('approved')
  })
})
