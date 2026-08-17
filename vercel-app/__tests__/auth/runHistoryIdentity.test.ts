/**
 * OTP identity for run persist + history. Not Supabase Auth.
 * Does not print emails or secrets.
 */

jest.mock('@/lib/supabase', () => ({
  persistRun: jest.fn(async () => null),
}))

import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest } from 'next/server'
import { GET as historyList } from '@/app/api/history/route'
import { GET as historyOne } from '@/app/api/history/[id]/route'
import {
  assertUserIdWhenSession,
  otpUserIdFromEmail,
  userIdFromOtpCookie,
} from '@/lib/auth/run-identity'
import { persistAttributedRun } from '@/lib/auth/runs-db'
import { createSessionToken } from '@/lib/auth/session'

const SECRET = 'test-otp-session-secret-32chars-min'
const EMAIL = 'approved@lab.in'

function getRequest(url: string, cookie?: string): NextRequest {
  const headers = new Headers()
  if (cookie) headers.set('cookie', cookie)
  return new NextRequest(url, { method: 'GET', headers })
}

describe('OTP user id for persist and history', () => {
  it('derives a stable opaque uuid from the OTP email, not the email string', async () => {
    const a = await otpUserIdFromEmail(EMAIL, SECRET)
    const b = await otpUserIdFromEmail('  Approved@Lab.in ', SECRET)
    const other = await otpUserIdFromEmail('other@lab.in', SECRET)
    expect(a).toBe(b)
    expect(a).not.toBe(other)
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(a.includes('approved')).toBe(false)
    expect(a.includes(EMAIL)).toBe(false)
  })

  it('resolves the same id from a signed OTP cookie', async () => {
    const token = await createSessionToken(EMAIL, SECRET)
    const fromCookie = await userIdFromOtpCookie(token, SECRET)
    const fromEmail = await otpUserIdFromEmail(EMAIL, SECRET)
    expect(fromCookie).toBe(fromEmail)
  })

  it('returns null without a session and refuses null user_id when a session exists', async () => {
    expect(await userIdFromOtpCookie(undefined, SECRET)).toBeNull()
    expect(() => assertUserIdWhenSession(true, null)).toThrow(/user_id is missing/)
    expect(() => assertUserIdWhenSession(false, null)).not.toThrow()
    const id = await otpUserIdFromEmail(EMAIL, SECRET)
    expect(() => assertUserIdWhenSession(true, id)).not.toThrow()
  })

  it('refuses to persist a run with no user_id', async () => {
    const id = await persistAttributedRun({
      user_id: null,
      run_data: { events: [] },
    })
    expect(id).toBeNull()
  })
})

describe('history API requires OTP session', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env = { ...env, OTP_SESSION_SECRET: SECRET }
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('lists 401 without a cookie and does not bypass auth', async () => {
    const res = await historyList(getRequest('http://localhost/api/history'))
    expect(res.status).toBe(401)
    const body = await res.json() as { authenticated: boolean; runs: unknown[] }
    expect(body.authenticated).toBe(false)
    expect(body.runs).toEqual([])
  })

  it('fetch-one 401 without a cookie', async () => {
    const res = await historyOne(getRequest('http://localhost/api/history/abc'), { params: { id: 'abc' } })
    expect(res.status).toBe(401)
  })

  it('lists 200 with an OTP cookie and does not include email', async () => {
    const token = await createSessionToken(EMAIL, SECRET)
    const res = await historyList(getRequest('http://localhost/api/history', `im_otp_session=${token}`))
    expect(res.status).toBe(200)
    const body = await res.json() as { authenticated: boolean; runs: unknown[]; email?: string }
    expect(body.authenticated).toBe(true)
    expect(Array.isArray(body.runs)).toBe(true)
    expect(body.email).toBeUndefined()
    expect(JSON.stringify(body)).not.toContain(EMAIL)
  })
})

describe('source guards: OTP identity not supabase.auth', () => {
  const root = join(__dirname, '../..')

  it('history page queries /api/history, not supabase.auth.getSession', () => {
    const src = readFileSync(join(root, 'app/history/page.tsx'), 'utf8')
    expect(src).toMatch(/\/api\/history/)
    expect(src).not.toMatch(/supabase\.auth\.getSession/)
    expect(src).not.toMatch(/let composite/)
  })

  it('run-scenario does not hardcode user_id null', () => {
    const src = readFileSync(join(root, 'app/api/run-scenario/route.ts'), 'utf8')
    expect(src).toMatch(/userIdFromOtpCookie/)
    expect(src).toMatch(/assertUserIdWhenSession/)
    expect(src).toMatch(/toSavedRun\(response\)/)
    expect(src).not.toMatch(/user_id:\s*null/)
    expect(src).not.toMatch(/run_data:\s*\{\s*events/)
  })

  it('history reopen reads payload.report, not run_data', () => {
    const page = readFileSync(join(root, 'app/history/page.tsx'), 'utf8')
    const route = readFileSync(join(root, 'app/api/history/[id]/route.ts'), 'utf8')
    expect(route).toMatch(/\{ ok: true, report \}/)
    expect(route).toMatch(/incomplete_saved_run/)
    expect(route).not.toMatch(/run_data:\s*run\.run_data/)
    expect(page).toMatch(/payload\.report/)
    expect(page).toMatch(/res\.status === 422/)
    expect(page).not.toMatch(/payload\.run_data/)
  })
})
