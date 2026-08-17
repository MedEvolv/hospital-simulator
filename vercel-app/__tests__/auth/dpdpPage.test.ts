/**
 * /dpdp Section 8 correction (2026-08-17): data quality, not GDPR Art 22.
 * Gated like other explainers. No NHRP centres. No BODH mandate.
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

describe('DPDP page gate', () => {
  const env = { ...process.env }

  beforeEach(() => {
    resetMemoryAccess()
    process.env = { ...env, ACCESS_STORE: 'memory' }
    putMemoryAccess(approvedStubRow(APPROVED))
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('keeps /dpdp gated and the splash public', () => {
    expect(isPublicPath('/')).toBe(true)
    expect(isGatedPath('/dpdp')).toBe(true)
    expect(isGatedPath('/dpdp/extra')).toBe(true)
  })

  it('redirects unauthenticated /dpdp to the splash with next=', async () => {
    const decision = await decideAuth({ pathname: '/dpdp', sessionCookie: null, secret: SECRET })
    expect(decision.type).toBe('redirect')
    if (decision.type === 'redirect') {
      expect(decision.location).toBe(splashRedirect('/dpdp'))
      expect(decision.location).toContain('next=')
    }
  })

  it('lets an approved session into /dpdp', async () => {
    const cookie = await createSessionToken(APPROVED, SECRET)
    const decision = await decideAuth({ pathname: '/dpdp', sessionCookie: cookie, secret: SECRET })
    expect(decision).toEqual({ type: 'next' })
  })
})

describe('DPDP Section 8 is not a human-review right', () => {
  const page = readPage('dpdp/page.tsx')

  it('teaches Section 8 as general fiduciary obligations and 8(3) data quality', () => {
    expect(page).toContain('General obligations of Data Fiduciary')
    expect(page).toContain('8(3)')
    expect(page).toContain('completeness, accuracy, and consistency')
    expect(page).toContain('data-quality duty')
    expect(page).toContain('8(5)')
    expect(page).toContain('8(6)')
    expect(page).toContain('Schedule item 1')
    expect(page).toContain('ss.11')
    expect(page).toContain('ss.11-14')
  })

  it('places the human look in NABL / NABH / SAHI / duty, not in Section 8', () => {
    expect(page).toContain('NABL ISO 15189:2022 clause 7.3')
    expect(page).toContain('NABH Digital Health Standards, 2nd Edition')
    expect(page).toContain('SAHI Rec 6')
    expect(page).toContain('Rec 22')
    expect(page).toContain('Never cite DPDP Section 8 for human review')
    expect(page).toContain('GDPR Article 22')
    expect(page).toContain('India has not legislated an equivalent')
  })

  it('kills the GDPR Article 22 import and does not invent NHRP centres or a BODH mandate', () => {
    expect(page).not.toContain('Automated Decision-Making & Profiling')
    expect(page).not.toContain('meaningful information about the logic')
    expect(page).not.toContain('human-review pathways')
    expect(page).not.toContain('Automated decision-making + human review (Section 8)')
    expect(page).not.toContain('automated decision-making with a right to human review')
    expect(page).not.toContain('Where §8 guarantees a human review path')
    expect(page).not.toMatch(/portability/)
    expect(page).not.toMatch(/funded centre|NHRP Validation/)
    expect(page).not.toMatch(/mandatory:\s*false/)
    expect(page).not.toMatch(/\u2014/)
    expect(page).not.toMatch(/&mdash;/)
  })
})
