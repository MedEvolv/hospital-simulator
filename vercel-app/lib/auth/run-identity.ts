/**
 * OTP session → opaque run owner id.
 *
 * The door is `im_otp_session` (email HMAC cookie), not Supabase Auth.
 * History and persist must use this id so a verified OTP user sees only
 * their runs. The id is a UUID derived from HMAC(email); it is not the
 * email string and must not be logged.
 */

import { hmacSha256Hex } from './crypto'
import { normalizeEmail } from './otp'
import { readSessionToken, type SessionPayload } from './session'

const USER_ID_PREFIX = 'im-otp-uid:v1:'

function hexToUuid(hex: string): string {
  const h = hex.slice(0, 32).padEnd(32, '0')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

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
  const resolved = secret ?? process.env.OTP_SESSION_SECRET ?? ''
  if (resolved.length < 32) return null
  return otpUserIdFromEmail(session.email, resolved)
}

export async function userIdFromOtpCookie(
  cookie: string | undefined | null,
  secret?: string,
): Promise<string | null> {
  const session = await readSessionToken(cookie, secret)
  return userIdFromOtpSession(session, secret)
}

/** Persist must not write null user_id when an OTP session exists. */
export function assertUserIdWhenSession(sessionPresent: boolean, userId: string | null): void {
  if (sessionPresent && !userId) {
    throw new Error('OTP session present but run user_id is missing')
  }
}
