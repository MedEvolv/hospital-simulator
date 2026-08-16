/**
 * ABDM interoperability-floor page: gated like other explainers,
 * inbound chips, evidence-safe copy. Does not touch GLP or history identity.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { decideAuth } from '@/lib/auth/gate'
import { isGatedPath, isPublicPath, splashRedirect } from '@/lib/auth/config'
import { createSessionToken } from '@/lib/auth/session'
import { approvedStubRow, putMemoryAccess, resetMemoryAccess } from '@/lib/auth/access-memory'

const SECRET = 'test-otp-session-secret-32chars-min'
const APPROVED = 'approved@lab.in'
const APP = join(__dirname, '../../app')

function readPage(rel: string): string {
  return readFileSync(join(APP, rel), 'utf8')
}

describe('ABDM page gate', () => {
  const env = { ...process.env }

  beforeEach(() => {
    resetMemoryAccess()
    process.env = { ...env, ACCESS_STORE: 'memory' }
    putMemoryAccess(approvedStubRow(APPROVED))
  })

  afterEach(() => {
    process.env = { ...env }
    resetMemoryAccess()
  })

  it('keeps /abdm gated and the splash public', () => {
    expect(isPublicPath('/')).toBe(true)
    expect(isGatedPath('/abdm')).toBe(true)
    expect(isGatedPath('/abdm/extra')).toBe(true)
  })

  it('redirects unauthenticated /abdm to the splash with next=', async () => {
    const decision = await decideAuth({ pathname: '/abdm', sessionCookie: null, secret: SECRET })
    expect(decision.type).toBe('redirect')
    if (decision.type === 'redirect') {
      expect(decision.location).toBe(splashRedirect('/abdm'))
      expect(decision.location).toContain('next=')
    }
  })

  it('lets an approved session into /abdm', async () => {
    const cookie = await createSessionToken(APPROVED, SECRET)
    const decision = await decideAuth({ pathname: '/abdm', sessionCookie: cookie, secret: SECRET })
    expect(decision).toEqual({ type: 'next' })
  })
})

describe('ABDM page copy and inbound chips', () => {
  const page = readPage('abdm/page.tsx')

  it('grounds the floor in official hosts and does not treat 0.0.1 as current', () => {
    expect(page).toContain('https://abdm.gov.in/digital-initiatives')
    expect(page).toContain('https://abdm.gov.in/uhi')
    expect(page).toContain('https://nhcx.abdm.gov.in/')
    expect(page).toContain('https://drugregistry.abdm.gov.in/')
    expect(page).toContain('https://www.nrces.in/bhts')
    expect(page).toContain('https://abdm.gov.in/hmis-lite')
    expect(page).toContain('https://github.com/NHA-ABDM')
    expect(page).toContain('does not treat 0.0.1 as current')
    expect(page).toContain('Consent Monday')
    expect(page).not.toMatch(/\u2014/)
    expect(page).not.toMatch(/503 objective/)
    expect(page).not.toMatch(/Nimisha|HealthSutra|IIT/)
  })

  it('wires inbound chips from home and sibling explainers', () => {
    expect(readPage('home/page.tsx')).toContain('href="/abdm"')
    expect(readPage('dpdp/page.tsx')).toContain('href="/abdm"')
    expect(readPage('sahi/page.tsx')).toContain('href="/abdm"')
    expect(readPage('nabh/page.tsx')).toContain('href="/abdm"')
    expect(readPage('cdsco/page.tsx')).toContain('href="/abdm"')
    expect(readPage('governance-models/page.tsx')).toContain('href="/abdm"')
  })
})
