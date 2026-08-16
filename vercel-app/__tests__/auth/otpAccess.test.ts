/**
 * OTP access control tests.
 *
 * Stubbed send path only. These tests never hit live SMS or Resend.
 */

import { createChallengeToken, generateOtp, isValidEmail, readChallengeToken, verifyLocalOtp } from '@/lib/auth/otp'
import { createSessionToken, readSessionToken } from '@/lib/auth/session'
import { decideAuth } from '@/lib/auth/gate'
import { isGatedPath, isPublicPath, safeNextPath } from '@/lib/auth/config'

const SECRET = 'test-otp-session-secret-32chars-min'

describe('public vs gated paths', () => {
  it('keeps the splash public and the old homepage gated', () => {
    expect(isPublicPath('/')).toBe(true)
    expect(isGatedPath('/home')).toBe(true)
    expect(isGatedPath('/dpdp')).toBe(true)
    expect(isGatedPath('/sahi')).toBe(true)
    expect(isGatedPath('/nabh')).toBe(true)
    expect(isGatedPath('/cdsco')).toBe(true)
    expect(isGatedPath('/governance-models')).toBe(true)
    expect(isGatedPath('/governance')).toBe(true)
    expect(isPublicPath('/api/auth/request')).toBe(true)
    expect(isPublicPath('/api/auth/verify')).toBe(true)
  })

  it('rejects open redirects in next=', () => {
    expect(safeNextPath('https://evil.example')).toBe('/home')
    expect(safeNextPath('//evil.example')).toBe('/home')
    expect(safeNextPath('/dpdp')).toBe('/dpdp')
  })
})

describe('session cookie', () => {
  it('round-trips a signed session and rejects a bad signature', async () => {
    const token = await createSessionToken('doc@hospital.in', SECRET)
    const ok = await readSessionToken(token, SECRET)
    expect(ok?.email).toBe('doc@hospital.in')
    const bad = await readSessionToken(token.slice(0, -2) + 'ab', SECRET)
    expect(bad).toBeNull()
  })
})

describe('OTP local verify (stub path)', () => {
  it('accepts the matching six-digit code', async () => {
    expect(isValidEmail('  Doc@Hospital.in ')).toBe(true)
    const otp = generateOtp()
    expect(otp).toMatch(/^\d{6}$/)
    const token = await createChallengeToken({
      email: 'doc@hospital.in',
      secret: SECRET,
      mode: 'local',
      otp,
    })
    const challenge = await readChallengeToken(token, SECRET)
    expect(challenge?.email).toBe('doc@hospital.in')
    await expect(verifyLocalOtp(challenge!, otp, SECRET)).resolves.toBe(true)
    await expect(verifyLocalOtp(challenge!, '000000', SECRET)).resolves.toBe(false)
  })
})

describe('middleware gate', () => {
  it('lets unauthenticated visitors stay on the splash', async () => {
    const decision = await decideAuth({ pathname: '/', sessionCookie: null, secret: SECRET })
    expect(decision).toEqual({ type: 'next' })
  })

  it('redirects unauthenticated explainer and home routes to the splash', async () => {
    for (const pathname of ['/dpdp', '/sahi', '/nabh', '/cdsco', '/governance-models', '/governance', '/home']) {
      const decision = await decideAuth({ pathname, sessionCookie: null, secret: SECRET })
      expect(decision.type).toBe('redirect')
      if (decision.type === 'redirect') {
        expect(decision.location.startsWith('/')).toBe(true)
        expect(decision.location.includes('/dpdp') || decision.location === '/' || decision.location.startsWith('/?next=')).toBe(true)
      }
    }
  })

  it('lets a valid session into /home and /dpdp', async () => {
    const cookie = await createSessionToken('doc@hospital.in', SECRET)
    const home = await decideAuth({ pathname: '/home', sessionCookie: cookie, secret: SECRET })
    const dpdp = await decideAuth({ pathname: '/dpdp', sessionCookie: cookie, secret: SECRET })
    expect(home).toEqual({ type: 'next' })
    expect(dpdp).toEqual({ type: 'next' })
  })
})
