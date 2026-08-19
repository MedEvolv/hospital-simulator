/**
 * Module: OTP session → run owner
 *
 * Interface (everything persist / list / history must know):
 *
 *   runOwnerFromRequest(req) → owner UUID | null
 *   userIdFromOtpCookie(cookie) → same result (stable name for history)
 *
 *   Input: a cookies bag, or the raw `im_otp_session` value.
 *   Output: opaque UUID derived from HMAC(email), or null if unauthenticated.
 *   Error: throws if a verified session exists but owner id cannot be derived
 *          (fail closed — persist must not write anonymous while logged in).
 *   Config: OTP_SESSION_SECRET, length ≥ 32. Do not rotate; it keys all history.
 *   Privacy: owner id is not the email. Do not log email or the secret.
 *
 * Implementation hides cookie name, token parse, HMAC prefix, and the assert.
 * Callers must not re-derive HMAC or call readSessionToken for this.
 *
 * The door is `im_otp_session`, not Supabase Auth.
 */

import { SESSION_COOKIE } from './config'
import { hmacSha256Hex } from './crypto'
import { normalizeEmail } from './otp'
import { readSessionToken, type SessionPayload } from './session'

const USER_ID_PREFIX = 'im-otp-uid:v1:'

export type CookieReader = {
  get(name: string): { value: string } | undefined
}

export type RunOwnerRequest = {
  cookies: CookieReader
}

function hexToUuid(hex: string): string {
  const h = hex.slice(0, 32).padEnd(32, '0')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

function resolveSecret(secret?: string): string {
  return secret ?? process.env.OTP_SESSION_SECRET ?? ''
}

/** HMAC UUID from a verified email. Tests and seed rows; HTTP routes should not call this. */
export async function otpUserIdFromEmail(email: string, secret: string): Promise<string> {
  if (secret.length < 32) {
    throw new Error('OTP_SESSION_SECRET is missing or shorter than 32 characters')
  }
  const hex = await hmacSha256Hex(secret, USER_ID_PREFIX + normalizeEmail(email))
  return hexToUuid(hex)
}

export async function userIdFromOtpSession(
  session: SessionPayload | null,
  secret?: string,
): Promise<string | null> {
  if (!session?.email) return null
  const resolved = resolveSecret(secret)
  if (resolved.length < 32) return null
  return otpUserIdFromEmail(session.email, resolved)
}

/** Persist must not write null user_id when an OTP session exists. */
export function assertUserIdWhenSession(sessionPresent: boolean, userId: string | null): void {
  if (sessionPresent && !userId) {
    throw new Error('OTP session present but run user_id is missing')
  }
}

/**
 * Cookie value → owner id. History may keep this import name.
 * One token read, then HMAC. Fail closed when the session verifies but id does not.
 */
export async function userIdFromOtpCookie(
  cookie: string | undefined | null,
  secret?: string,
): Promise<string | null> {
  const resolved = resolveSecret(secret)
  const session = await readSessionToken(cookie, resolved)
  if (!session) return null
  const userId = await userIdFromOtpSession(session, resolved)
  assertUserIdWhenSession(true, userId)
  return userId
}

/**
 * Preferred HTTP entry: cookies bag in, owner id or unauthenticated out.
 * Hides SESSION_COOKIE, token parse, and HMAC.
 */
export async function runOwnerFromRequest(
  req: RunOwnerRequest,
  secret?: string,
): Promise<string | null> {
  return userIdFromOtpCookie(req.cookies.get(SESSION_COOKIE)?.value, secret)
}
