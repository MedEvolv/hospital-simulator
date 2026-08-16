import type { AccessRow } from './access-types'

const rows = new Map<string, AccessRow>()

export function resetMemoryAccess(): void {
  rows.clear()
}

export function getMemoryAccess(email: string): AccessRow | undefined {
  return rows.get(email.trim().toLowerCase())
}

export function putMemoryAccess(row: AccessRow): AccessRow {
  const next = { ...row, work_email: row.work_email.trim().toLowerCase() }
  rows.set(next.work_email, next)
  return next
}

export function listMemoryAccess(): AccessRow[] {
  return [...rows.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function approvedStubRow(email: string, overrides: Partial<AccessRow> = {}): AccessRow {
  const now = new Date().toISOString()
  return {
    id: overrides.id ?? `mem-${email}`,
    work_email: email.trim().toLowerCase(),
    full_name: overrides.full_name ?? 'Test practitioner',
    role: overrides.role ?? 'Pathologist',
    organisation: overrides.organisation ?? 'Test lab',
    organisation_type: overrides.organisation_type ?? 'lab',
    organisation_type_other: overrides.organisation_type_other ?? null,
    city: overrides.city ?? 'Delhi',
    linkedin_url: overrides.linkedin_url ?? 'https://www.linkedin.com/in/test-practitioner',
    mirror_for: overrides.mirror_for ?? ['DPDP'],
    mirror_for_other: overrides.mirror_for_other ?? null,
    use_sentence: overrides.use_sentence ?? 'Rehearse a synthetic follow-up door.',
    attest_rehearsal_only: true,
    attest_not_certification: true,
    attest_authorised: true,
    contact_ok: overrides.contact_ok ?? true,
    status: overrides.status ?? 'approved',
    deny_reason: overrides.deny_reason ?? null,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
    approved_at: overrides.status && overrides.status !== 'approved' ? null : (overrides.approved_at ?? now),
    denied_at: overrides.denied_at ?? null,
    revoked_at: overrides.revoked_at ?? null,
  }
}
