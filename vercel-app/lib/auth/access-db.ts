/**
 * Node-only access writes. API routes import this. Middleware must not.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { approvedStubRow, getMemoryAccess, listMemoryAccess, putMemoryAccess } from './access-memory'
import { parseAdminEmails } from './admins'
import { supabaseServiceConfig, useMemoryAccessStore } from './access-lookup'
import { FIELD_LIMITS, type AccessRow, type AccessStatus } from './access-types'
import { normalizeEmail } from './otp'

const TABLE = 'mirror_access_requests'

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const code = error.code ?? ''
  const message = error.message ?? ''
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message)
  )
}

function serviceClient(): SupabaseClient | null {
  const svc = supabaseServiceConfig()
  if (!svc) return null
  return createClient(svc.url, svc.key, { auth: { persistSession: false } })
}

function anonClient(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function mapRow(raw: Record<string, unknown>): AccessRow {
  return {
    id: String(raw.id),
    work_email: normalizeEmail(String(raw.work_email)),
    full_name: String(raw.full_name),
    role: String(raw.role),
    organisation: String(raw.organisation),
    organisation_type: raw.organisation_type as AccessRow['organisation_type'],
    organisation_type_other: typeof raw.organisation_type_other === 'string' ? raw.organisation_type_other : null,
    city: String(raw.city),
    linkedin_url: String(raw.linkedin_url ?? ''),
    mirror_for: (Array.isArray(raw.mirror_for) ? raw.mirror_for : []) as AccessRow['mirror_for'],
    mirror_for_other: typeof raw.mirror_for_other === 'string' ? raw.mirror_for_other : null,
    use_sentence: String(raw.use_sentence),
    attest_rehearsal_only: raw.attest_rehearsal_only === true,
    attest_not_certification: raw.attest_not_certification === true,
    attest_authorised: raw.attest_authorised === true,
    contact_ok: raw.contact_ok === true,
    status: raw.status as AccessStatus,
    deny_reason: typeof raw.deny_reason === 'string' ? raw.deny_reason : null,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    approved_at: typeof raw.approved_at === 'string' ? raw.approved_at : null,
    denied_at: typeof raw.denied_at === 'string' ? raw.denied_at : null,
    revoked_at: typeof raw.revoked_at === 'string' ? raw.revoked_at : null,
  }
}

export type WriteResult =
  | { ok: true; row: AccessRow }
  | { ok: false; setup: true; error: string }
  | { ok: false; setup: false; error: string }

export async function insertPendingRequest(
  value: Omit<
    AccessRow,
    'id' | 'status' | 'deny_reason' | 'created_at' | 'updated_at' | 'approved_at' | 'denied_at' | 'revoked_at'
  >,
): Promise<WriteResult> {
  const now = new Date().toISOString()
  const payload = {
    work_email: value.work_email,
    full_name: value.full_name,
    role: value.role,
    organisation: value.organisation,
    organisation_type: value.organisation_type,
    organisation_type_other: value.organisation_type_other,
    city: value.city,
    linkedin_url: value.linkedin_url,
    mirror_for: value.mirror_for,
    mirror_for_other: value.mirror_for_other,
    use_sentence: value.use_sentence,
    attest_rehearsal_only: true,
    attest_not_certification: true,
    attest_authorised: true,
    contact_ok: true,
    status: 'pending' as const,
  }

  if (useMemoryAccessStore()) {
    const existing = getMemoryAccess(value.work_email)
    if (existing) return { ok: true, row: existing }
    const row = putMemoryAccess({
      ...payload,
      id: `mem-${value.work_email}`,
      deny_reason: null,
      created_at: now,
      updated_at: now,
      approved_at: null,
      denied_at: null,
      revoked_at: null,
    })
    return { ok: true, row }
  }

  const client = serviceClient() ?? anonClient()
  if (!client) {
    return {
      ok: false,
      setup: true,
      error: 'Access requests are not open yet. Apply the mirror_access_requests migration.',
    }
  }

  const { data, error } = await client.from(TABLE).insert(payload).select('*').single()
  if (error) {
    if (isMissingTable(error)) {
      return {
        ok: false,
        setup: true,
        error: 'Access requests are not open yet. Apply the mirror_access_requests migration.',
      }
    }
    if (error.code === '23505') {
      const existing = await client.from(TABLE).select('*').eq('work_email', value.work_email).maybeSingle()
      if (existing.data) return { ok: true, row: mapRow(existing.data as Record<string, unknown>) }
    }
    return { ok: false, setup: false, error: 'Could not save this request.' }
  }
  return { ok: true, row: mapRow(data as Record<string, unknown>) }
}

export async function listAccessRequests(): Promise<
  { ok: true; rows: AccessRow[] } | { ok: false; setup: boolean; error: string }
> {
  if (useMemoryAccessStore()) {
    return { ok: true, rows: listMemoryAccess() }
  }
  const client = serviceClient()
  if (!client) {
    return {
      ok: false,
      setup: true,
      error: 'Access queue needs SUPABASE_SERVICE_KEY and the mirror_access_requests table.',
    }
  }
  const { data, error } = await client.from(TABLE).select('*').order('created_at', { ascending: false })
  if (error) {
    return {
      ok: false,
      setup: isMissingTable(error),
      error: isMissingTable(error)
        ? 'Apply supabase/migrations/20260816_mirror_access_requests.sql in the Supabase SQL editor.'
        : 'Could not load the access queue.',
    }
  }
  return { ok: true, rows: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) }
}

export async function setAccessStatus(
  workEmail: string,
  status: 'approved' | 'denied' | 'revoked',
  denyReason?: string,
): Promise<WriteResult> {
  const email = normalizeEmail(workEmail)
  const now = new Date().toISOString()
  const reason =
    status === 'denied' && denyReason
      ? denyReason.replace(/\s+/g, ' ').trim().slice(0, FIELD_LIMITS.deny_reason)
      : null
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
    deny_reason: status === 'denied' ? reason : null,
    approved_at: status === 'approved' ? now : null,
    denied_at: status === 'denied' ? now : null,
    revoked_at: status === 'revoked' ? now : null,
  }

  if (useMemoryAccessStore()) {
    const existing = getMemoryAccess(email)
    if (!existing) return { ok: false, setup: false, error: 'No request for that email.' }
    const row = putMemoryAccess({ ...existing, ...patch, status, deny_reason: (patch.deny_reason as string | null) ?? null } as AccessRow)
    return { ok: true, row }
  }

  const client = serviceClient()
  if (!client) {
    return { ok: false, setup: true, error: 'Access queue needs SUPABASE_SERVICE_KEY.' }
  }
  const { data, error } = await client.from(TABLE).update(patch).eq('work_email', email).select('*').maybeSingle()
  if (error) {
    return {
      ok: false,
      setup: isMissingTable(error),
      error: isMissingTable(error)
        ? 'Apply supabase/migrations/20260816_mirror_access_requests.sql in the Supabase SQL editor.'
        : 'Could not update that request.',
    }
  }
  if (!data) return { ok: false, setup: false, error: 'No request for that email.' }
  return { ok: true, row: mapRow(data as Record<string, unknown>) }
}

export async function ensureSeededAdminRows(): Promise<void> {
  const now = new Date().toISOString()
  const emails = parseAdminEmails()
  if (useMemoryAccessStore()) {
    for (const email of emails) {
      if (!getMemoryAccess(email)) {
        putMemoryAccess(
          approvedStubRow(email, {
            full_name: 'Seeded operator',
            role: 'Founder',
            organisation: 'ArchLife',
            organisation_type: 'other',
            organisation_type_other: 'Estate',
            city: 'Delhi',
            linkedin_url: 'https://www.linkedin.com/in/dr-ishaan-wadhwa-98a017244',
            use_sentence: 'Seeded so the access queue can be reached.',
            approved_at: now,
          }),
        )
      }
    }
    return
  }

  const client = serviceClient()
  if (!client) return
  for (const email of emails) {
    const { data, error } = await client.from(TABLE).select('work_email').eq('work_email', email).maybeSingle()
    if (error && isMissingTable(error)) return
    if (data) continue
    await client.from(TABLE).insert({
      work_email: email,
      full_name: 'Seeded operator',
      role: 'Founder',
      organisation: 'ArchLife',
      organisation_type: 'other',
      organisation_type_other: 'Estate',
      city: 'Delhi',
      linkedin_url: 'https://www.linkedin.com/in/dr-ishaan-wadhwa-98a017244',
      mirror_for: ['DPDP'],
      use_sentence: 'Seeded so the access queue can be reached.',
      attest_rehearsal_only: true,
      attest_not_certification: true,
      attest_authorised: true,
      contact_ok: true,
      status: 'approved',
      approved_at: now,
    })
  }
}
