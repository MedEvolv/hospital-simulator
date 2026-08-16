/**
 * Edge-safe access lookup. No supabase-js. Middleware can import this.
 *
 * Fail closed: missing row is not approved. Seeded founder / MIRROR_ADMIN_EMAILS
 * emails are approved when no row exists, so the queue can be reached before
 * the SQL migration is applied. A revoked row still wins.
 */

import { getMemoryAccess } from './access-memory'
import { isSeededApprovedEmail } from './admins'
import { TABLE_MISSING, type AccessRow, type AccessStatus, type LookupResult } from './access-types'
import { normalizeEmail } from './otp'

export function useMemoryAccessStore(): boolean {
  return process.env.AUTH_OTP_STUB === '1' || process.env.ACCESS_STORE === 'memory'
}

export function supabaseServiceConfig(): { url: string; key: string } | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) return null
  return { url: url.replace(/\/$/, ''), key }
}

function isTableMissingPayload(status: number, body: unknown): boolean {
  if (status === 404) return true
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const code = typeof record.code === 'string' ? record.code : ''
  const message = typeof record.message === 'string' ? record.message : ''
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message)
  )
}

function coerceRow(raw: Record<string, unknown>): AccessRow | null {
  if (typeof raw.work_email !== 'string' || typeof raw.status !== 'string') return null
  const mirrorFor = Array.isArray(raw.mirror_for)
    ? raw.mirror_for.map((chip) => String(chip))
    : []
  return {
    id: String(raw.id ?? raw.work_email),
    work_email: normalizeEmail(raw.work_email),
    full_name: String(raw.full_name ?? ''),
    role: String(raw.role ?? ''),
    organisation: String(raw.organisation ?? ''),
    organisation_type: raw.organisation_type as AccessRow['organisation_type'],
    organisation_type_other: typeof raw.organisation_type_other === 'string' ? raw.organisation_type_other : null,
    city: String(raw.city ?? ''),
    linkedin_url: String(raw.linkedin_url ?? ''),
    mirror_for: mirrorFor as AccessRow['mirror_for'],
    mirror_for_other: typeof raw.mirror_for_other === 'string' ? raw.mirror_for_other : null,
    use_sentence: String(raw.use_sentence ?? ''),
    attest_rehearsal_only: raw.attest_rehearsal_only === true,
    attest_not_certification: raw.attest_not_certification === true,
    attest_authorised: raw.attest_authorised === true,
    contact_ok: raw.contact_ok === true,
    status: raw.status as AccessRow['status'],
    deny_reason: typeof raw.deny_reason === 'string' ? raw.deny_reason : null,
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
    approved_at: typeof raw.approved_at === 'string' ? raw.approved_at : null,
    denied_at: typeof raw.denied_at === 'string' ? raw.denied_at : null,
    revoked_at: typeof raw.revoked_at === 'string' ? raw.revoked_at : null,
  }
}

export async function lookupAccessRow(email: string): Promise<LookupResult> {
  const workEmail = normalizeEmail(email)
  if (useMemoryAccessStore()) {
    const row = getMemoryAccess(workEmail)
    return row ? { kind: 'row', row } : { kind: 'missing' }
  }

  const svc = supabaseServiceConfig()
  if (!svc) return { kind: TABLE_MISSING }

  const url = `${svc.url}/rest/v1/mirror_access_requests?work_email=eq.${encodeURIComponent(workEmail)}&select=*`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: svc.key,
        Authorization: `Bearer ${svc.key}`,
        Accept: 'application/json',
      },
    })
    const body = await res.json().catch(() => null)
    if (isTableMissingPayload(res.status, body)) return { kind: TABLE_MISSING }
    if (!res.ok) return { kind: TABLE_MISSING }
    const rows = Array.isArray(body) ? body : []
    if (rows.length === 0) return { kind: 'missing' }
    const row = coerceRow(rows[0] as Record<string, unknown>)
    if (!row) return { kind: 'missing' }
    return { kind: 'row', row }
  } catch {
    return { kind: TABLE_MISSING }
  }
}

export async function getAccessStatus(email: string): Promise<{
  status: AccessStatus | 'unknown'
  setup: boolean
  row: AccessRow | null
}> {
  const found = await lookupAccessRow(email)
  if (found.kind === 'row') {
    return { status: found.row.status, setup: false, row: found.row }
  }
  if (found.kind === TABLE_MISSING) {
    if (isSeededApprovedEmail(email)) {
      return { status: 'approved', setup: true, row: null }
    }
    return { status: 'unknown', setup: true, row: null }
  }
  if (isSeededApprovedEmail(email)) {
    return { status: 'approved', setup: false, row: null }
  }
  return { status: 'unknown', setup: false, row: null }
}

export async function isEmailApproved(email: string): Promise<boolean> {
  const state = await getAccessStatus(email)
  return state.status === 'approved'
}
