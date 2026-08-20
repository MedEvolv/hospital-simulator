/**
 * Fail-closed writers: OTP owner, dual service-key names, empty admin secret.
 * Does not print emails, OTP, DeepSeek, or service-key values.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest } from 'next/server'
import { POST as feedbackPost } from '@/app/api/feedback/route'
import { POST as generateReport } from '@/app/api/generate-report/route'
import { POST as patientProfiles } from '@/app/api/patient-profiles/route'
import { POST as adminAuth } from '@/app/api/admin/auth/route'
import { GET as adminRecs } from '@/app/api/admin/recommendations/route'
import {
  ADMIN_SECRET_MIN_LENGTH,
  adminBearerAuthorized,
  configuredAdminPassword,
} from '@/lib/auth/admin-gate'
import { isGatedPath } from '@/lib/auth/config'
import { createSessionToken } from '@/lib/auth/session'

const SECRET = 'test-otp-session-secret-32chars-min'
const APPROVED = 'approved@lab.in'
const ADMIN = 'dr.ishaan@medevolv.in'
const ROOT = join(__dirname, '../..')
const REPO = join(ROOT, '..')

function jsonRequest(url: string, body: object, cookie?: string, auth?: string): NextRequest {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (cookie) headers.set('cookie', cookie)
  if (auth) headers.set('authorization', auth)
  return new NextRequest(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function getRequest(url: string, cookie?: string, auth?: string): NextRequest {
  const headers = new Headers()
  if (cookie) headers.set('cookie', cookie)
  if (auth) headers.set('authorization', auth)
  return new NextRequest(url, { method: 'GET', headers })
}

describe('feedback requires OTP owner', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env = { ...env, OTP_SESSION_SECRET: SECRET }
    delete process.env.SUPABASE_SERVICE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('returns 401 without a session and does not persist', async () => {
    const res = await feedbackPost(jsonRequest('http://localhost/api/feedback', {
      runId: 'run-1',
      feedback: { note: 'x' },
    }))
    expect(res.status).toBe(401)
    const body = await res.json() as { persisted?: boolean }
    expect(body.persisted).toBeUndefined()
  })

  it('returns 503 with a session when both service-key names are missing', async () => {
    const token = await createSessionToken(APPROVED, SECRET)
    const res = await feedbackPost(jsonRequest(
      'http://localhost/api/feedback',
      { runId: 'run-1', feedback: { note: 'x' } },
      `im_otp_session=${token}`,
    ))
    expect(res.status).toBe(503)
  })
})

describe('DeepSeek routes require OTP', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env = { ...env, OTP_SESSION_SECRET: SECRET }
    delete process.env.DEEPSEEK_API_KEY
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('generate-report 401s without a session', async () => {
    const res = await generateReport(jsonRequest('http://localhost/api/generate-report', {
      role: 'cmo',
      result: { run_id: 'x' },
    }))
    expect(res.status).toBe(401)
  })

  it('patient-profiles 401s without a session', async () => {
    const res = await patientProfiles(jsonRequest('http://localhost/api/patient-profiles', {
      patient_ids: ['P1'],
    }))
    expect(res.status).toBe(401)
  })
})

describe('admin secrets fail closed', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env = { ...env, OTP_SESSION_SECRET: SECRET }
    delete process.env.ADMIN_PASSWORD
    delete process.env.MIRROR_ADMIN_EMAILS
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('treats empty ADMIN_PASSWORD as unauthorized, including Bearer space', () => {
    expect(ADMIN_SECRET_MIN_LENGTH).toBeGreaterThanOrEqual(8)
    expect(configuredAdminPassword()).toBeNull()
    const req = getRequest('http://localhost/api/admin/recommendations', undefined, 'Bearer ')
    expect(adminBearerAuthorized(req)).toBe(false)
  })

  it('rejects a short admin password', () => {
    process.env.ADMIN_PASSWORD = 'short'
    expect(configuredAdminPassword()).toBeNull()
  })

  it('learning APIs 401 when the password is unset even with an admin OTP cookie', async () => {
    const token = await createSessionToken(ADMIN, SECRET)
    const res = await adminRecs(getRequest(
      'http://localhost/api/admin/recommendations',
      `im_otp_session=${token}`,
      'Bearer ',
    ))
    expect(res.status).toBe(401)
  })

  it('admin auth 401 without OTP and 503 when the password is unset', async () => {
    const anon = await adminAuth(jsonRequest('http://localhost/api/admin/auth', { password: 'x' }))
    expect(anon.status).toBe(401)
    const token = await createSessionToken(ADMIN, SECRET)
    const unset = await adminAuth(jsonRequest(
      'http://localhost/api/admin/auth',
      { password: 'x' },
      `im_otp_session=${token}`,
    ))
    expect(unset.status).toBe(503)
  })

  it('gates /admin at the OTP door', () => {
    expect(isGatedPath('/admin')).toBe(true)
    expect(isGatedPath('/admin/access')).toBe(true)
  })
})

describe('source guards: dual keys, owner, no stray dumps', () => {
  function read(rel: string): string {
    return readFileSync(join(ROOT, rel), 'utf8')
  }

  it('feedback uses runOwnerFromRequest and both service-key names via supabaseServiceConfig', () => {
    const src = read('app/api/feedback/route.ts')
    expect(src).toMatch(/runOwnerFromRequest\(req\)/)
    expect(src).toMatch(/supabaseServiceConfig/)
    expect(src).toMatch(/\.eq\('user_id', owner\)/)
    expect(src).not.toMatch(/persisted: false/)
    const lookup = read('lib/auth/access-lookup.ts')
    expect(lookup).toMatch(/SUPABASE_SERVICE_KEY/)
    expect(lookup).toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  it('runs-db does not fall back to anon persist when service is missing', () => {
    const src = read('lib/auth/runs-db.ts')
    expect(src).toMatch(/supabaseServiceConfig/)
    expect(src).toMatch(/if \(!sb\) return null/)
    expect(src).not.toMatch(/return persistRun/)
  })

  it('generate-report and patient-profiles call runOwnerFromRequest before DeepSeek', () => {
    const report = read('app/api/generate-report/route.ts')
    const profiles = read('app/api/patient-profiles/route.ts')
    for (const src of [report, profiles]) {
      expect(src).toMatch(/runOwnerFromRequest\(req\)/)
      const ownerAt = src.indexOf('runOwnerFromRequest(req)')
      const spendAt = src.indexOf('deepseek.chat.completions.create')
      expect(ownerAt).toBeGreaterThan(0)
      expect(spendAt).toBeGreaterThan(ownerAt)
    }
  })

  it('Python persist is a no-op and both service-key names are OR-ed', () => {
    const runSim = read('api/run_simulation.py')
    const update = read('api/update_run.py')
    const cycle = read('api/learning_cycle.py')
    expect(runSim).toMatch(/SUPABASE_SERVICE_KEY/)
    expect(runSim).toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    expect(runSim).toMatch(/OTP persist lives in TypeScript runs-db/)
    expect(runSim).not.toMatch(/table\(['"]simulation_runs['"]\)\.insert/)
    expect(update).toMatch(/SUPABASE_SERVICE_KEY/)
    expect(update).toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    expect(update).toMatch(/eq\('user_id', owner\)/)
    expect(update).not.toMatch(/Access-Control-Allow-Origin['"],\s*['"]\*/)
    expect(cycle).toMatch(/SUPABASE_SERVICE_KEY/)
    expect(cycle).toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    expect(cycle).toMatch(/len\(secret\) < 8/)
    expect(cycle).not.toMatch(/Access-Control-Allow-Origin['"],\s*['"]\*/)
  })

  it('learning admin routes use requireLearningAdmin and supabaseServiceConfig via adminServiceClient', () => {
    const recs = read('app/api/admin/recommendations/route.ts')
    const patch = read('app/api/admin/recommendations/[id]/route.ts')
    const cycles = read('app/api/admin/cycles/route.ts')
    const applied = read('app/api/admin/applied/route.ts')
    const gate = read('lib/auth/admin-gate.ts')
    for (const src of [recs, patch, cycles, applied]) {
      expect(src).toMatch(/requireLearningAdmin/)
      expect(src).toMatch(/adminServiceClient/)
      expect(src).not.toMatch(/Bearer \$\{process\.env\.ADMIN_PASSWORD/)
    }
    expect(gate).toMatch(/SUPABASE_SERVICE_KEY|supabaseServiceConfig/)
    expect(gate).toMatch(/ADMIN_SECRET_MIN_LENGTH = 8/)
  })

  it('gitignore names otp-body.json so a blanket add cannot stage it', () => {
    const rootIgnore = readFileSync(join(REPO, '.gitignore'), 'utf8')
    const appIgnore = readFileSync(join(ROOT, '.gitignore'), 'utf8')
    expect(rootIgnore).toMatch(/otp-body\.json/)
    expect(appIgnore).toMatch(/otp-body\.json/)
    expect(appIgnore).toMatch(/otp\.json/)
    expect(appIgnore).toMatch(/\*\.bak/)
  })

  it('handlers do not return String(err) or str(exc) to clients (M4)', () => {
    const report = read('app/api/generate-report/route.ts')
    const profiles = read('app/api/patient-profiles/route.ts')
    const feedback = read('app/api/feedback/route.ts')
    const runSim = read('api/run_simulation.py')
    const cycle = read('api/learning_cycle.py')
    for (const src of [report, profiles, feedback]) {
      expect(src).not.toMatch(/error:\s*String\(err\)/)
      expect(src).not.toMatch(/error:\s*err\.message/)
    }
    expect(runSim).not.toMatch(/_send_error\(500,\s*str\(exc\)\)/)
    expect(cycle).not.toMatch(/_send_error\(500,\s*str\(exc\)\)/)
    expect(report).toMatch(/console\.error\('\[generate-report\] DeepSeek error:'/)
    expect(profiles).toMatch(/fallback_exception/)
    expect(feedback).toMatch(/Lookup failed/)
    expect(feedback).toMatch(/Update failed/)
  })
})
