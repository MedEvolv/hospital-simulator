/**
 * OTP access control for the Institutional Mirror.
 *
 * Email OTP is proof of possession for practitioners opening the alignment
 * work. This is not NABH identity proofing, not a Continuity Profile, and
 * not a composite Mirror score.
 *
 * Phone OTP is the next provider once an SMS vendor is wired. Do not collect
 * phone and email together.
 */

export const SESSION_COOKIE = 'im_otp_session'
export const CHALLENGE_COOKIE = 'im_otp_challenge'

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
export const OTP_TTL_SECONDS = 10 * 60
export const OTP_MAX_ATTEMPTS = 5
export const OTP_LENGTH = 6

export const DEFAULT_AFTER_LOGIN = '/home'

/** Routes that require a verified OTP session. */
export const GATED_PREFIXES = [
  '/home',
  '/sahi',
  '/dpdp',
  '/nabh',
  '/cdsco',
  '/governance-models',
  '/governance',
  '/history',
  '/sandbox',
  '/survey',
  '/results',
  '/report',
  '/inspector',
  '/export',
] as const

export function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/api/auth/')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname === '/robots.txt' || pathname === '/favicon.ico') return true
  if (/\.(?:webp|png|jpe?g|gif|svg|ico|json|txt|css|js|map|woff2?)$/i.test(pathname)) return true
  return false
}

/** Only same-origin relative paths. Default landing is the gated project home. */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_AFTER_LOGIN
  if (!raw.startsWith('/')) return DEFAULT_AFTER_LOGIN
  if (raw.startsWith('//')) return DEFAULT_AFTER_LOGIN
  if (raw.startsWith('/api')) return DEFAULT_AFTER_LOGIN
  if (raw.includes('\\')) return DEFAULT_AFTER_LOGIN
  return raw
}

export function splashRedirect(nextPath: string): string {
  const next = safeNextPath(nextPath)
  if (next === DEFAULT_AFTER_LOGIN) return '/'
  return `/?next=${encodeURIComponent(next)}`
}
