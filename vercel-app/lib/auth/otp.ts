import { hmacSha256Base64Url, timingSafeEqual, utf8ToBase64Url, base64UrlToUtf8 } from './crypto'
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from './config'

export interface ChallengePayload {
  v: 1
  mode: 'local' | 'supabase'
  email: string
  hash?: string
  nonce: string
  exp: number
  attempts: number
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw)
  return email.length <= 254 && EMAIL_RE.test(email)
}

export function generateOtp(length = OTP_LENGTH): string {
  const digits = '0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += digits[bytes[i] % 10]
  }
  return out
}

export function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashOtp(secret: string, email: string, otp: string, nonce: string): Promise<string> {
  return hmacSha256Base64Url(secret, `otp:${email}:${otp}:${nonce}`)
}

export async function createChallengeToken(input: {
  email: string
  secret: string
  mode: 'local' | 'supabase'
  otp?: string
  ttlSeconds?: number
}): Promise<string> {
  const email = normalizeEmail(input.email)
  const nonce = generateNonce()
  const payload: ChallengePayload = {
    v: 1,
    mode: input.mode,
    email,
    nonce,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? OTP_TTL_SECONDS),
    attempts: 0,
  }
  if (input.mode === 'local') {
    if (!input.otp) throw new Error('local OTP challenge requires a code')
    payload.hash = await hashOtp(input.secret, email, input.otp, nonce)
  }
  const body = utf8ToBase64Url(JSON.stringify(payload))
  const sig = await hmacSha256Base64Url(input.secret, body)
  return `${body}.${sig}`
}

export async function readChallengeToken(
  token: string | undefined | null,
  secret: string,
): Promise<ChallengePayload | null> {
  if (!token || secret.length < 32) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = await hmacSha256Base64Url(secret, body)
  if (!timingSafeEqual(sig, expected)) return null
  try {
    const payload = JSON.parse(base64UrlToUtf8(body)) as ChallengePayload
    if (payload.v !== 1 || !payload.email || !payload.nonce) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function verifyLocalOtp(
  challenge: ChallengePayload,
  otp: string,
  secret: string,
): Promise<boolean> {
  if (challenge.mode !== 'local' || !challenge.hash) return false
  const hashed = await hashOtp(secret, challenge.email, otp.trim(), challenge.nonce)
  return timingSafeEqual(hashed, challenge.hash)
}

export async function bumpChallengeAttempts(
  challenge: ChallengePayload,
  secret: string,
): Promise<string | null> {
  const next = { ...challenge, attempts: challenge.attempts + 1 }
  if (next.attempts >= OTP_MAX_ATTEMPTS) return null
  const body = utf8ToBase64Url(JSON.stringify(next))
  const sig = await hmacSha256Base64Url(secret, body)
  return `${body}.${sig}`
}
