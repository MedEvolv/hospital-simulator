import { normalizeEmail } from './otp'

/**
 * Founder work emails already on the ArchLife / MedEvolv public surface.
 * Seeded as approved so the queue at /admin/access can be reached via OTP.
 * Not a public allowlist. Strangers still need a pending row and a yes.
 */
export const SEEDED_APPROVED_EMAILS = [
  'dr.ishaan@medevolv.in',
  'hello@archlife.in',
] as const

export function parseAdminEmails(raw = process.env.MIRROR_ADMIN_EMAILS): string[] {
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((part) => normalizeEmail(part))
      .filter((email) => email.includes('@'))
  }
  return SEEDED_APPROVED_EMAILS.map((email) => normalizeEmail(email))
}

export function isAdminEmail(email: string, raw = process.env.MIRROR_ADMIN_EMAILS): boolean {
  const needle = normalizeEmail(email)
  return parseAdminEmails(raw).includes(needle)
}

export function isSeededApprovedEmail(email: string): boolean {
  const needle = normalizeEmail(email)
  if (SEEDED_APPROVED_EMAILS.includes(needle as (typeof SEEDED_APPROVED_EMAILS)[number])) {
    return true
  }
  return isAdminEmail(needle)
}
