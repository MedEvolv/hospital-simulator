import { hmacSha256Base64Url, base64UrlToUtf8, timingSafeEqual, utf8ToBase64Url } from './crypto'
import { SESSION_TTL_SECONDS } from './config'

export interface SessionPayload {
  email: string
  exp: number
}

function getSecret(): string {
  return process.env.OTP_SESSION_SECRET ?? ''
}

export function sessionSecretConfigured(): boolean {
  return getSecret().length >= 32
}

export async function createSessionToken(
  email: string,
  secret = getSecret(),
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  if (secret.length < 32) {
    throw new Error('OTP_SESSION_SECRET is missing or shorter than 32 characters')
  }
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const body = utf8ToBase64Url(JSON.stringify(payload))
  const sig = await hmacSha256Base64Url(secret, body)
  return `${body}.${sig}`
}

export async function readSessionToken(
  token: string | undefined | null,
  secret = getSecret(),
): Promise<SessionPayload | null> {
  if (!token || secret.length < 32) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = await hmacSha256Base64Url(secret, body)
  if (!timingSafeEqual(sig, expected)) return null
  try {
    const payload = JSON.parse(base64UrlToUtf8(body)) as SessionPayload
    if (!payload.email || typeof payload.exp !== 'number') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
