import {
  ACCESS_LABELS,
  FIELD_LIMITS,
  MIRROR_FOR_CHIPS,
  ORG_TYPES,
  type IntakeInput,
  type MirrorForChip,
  type OrgType,
} from './access-types'
import { isValidEmail, normalizeEmail } from './otp'

const LINKEDIN_PATH = /^\/(in|company|pub)\/[^/]+/i

export function normalizeLinkedInUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().slice(0, FIELD_LIMITS.linkedin_url)
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    return null
  }
  const host = parsed.hostname.toLowerCase()
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return null
  if (host.endsWith('.linkedin.com') && host.split('.').length > 3) return null
  const path = parsed.pathname.replace(/\/+$/, '')
  if (!LINKEDIN_PATH.test(path)) return null
  return `https://www.linkedin.com${path}`
}

export interface IntakeValidationOk {
  ok: true
  value: {
    full_name: string
    work_email: string
    role: string
    organisation: string
    organisation_type: OrgType
    organisation_type_other: string | null
    city: string
    linkedin_url: string
    mirror_for: MirrorForChip[]
    mirror_for_other: string | null
    use_sentence: string
    attest_rehearsal_only: true
    attest_not_certification: true
    attest_authorised: true
    contact_ok: true
  }
}

export interface IntakeValidationErr {
  ok: false
  error: string
}

function clip(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, max)
}

function requireText(raw: unknown, label: string, max: number): string | IntakeValidationErr {
  const value = clip(raw, max)
  if (!value) return { ok: false, error: `Enter ${label.toLowerCase()}.` }
  return value
}

export function validateIntake(input: Partial<IntakeInput> | Record<string, unknown>): IntakeValidationOk | IntakeValidationErr {
  const full_name = requireText(input.full_name, ACCESS_LABELS.full_name, FIELD_LIMITS.full_name)
  if (typeof full_name !== 'string') return full_name

  const work_email = typeof input.work_email === 'string' ? normalizeEmail(input.work_email) : ''
  if (!isValidEmail(work_email)) {
    return { ok: false, error: 'Enter a valid work email.' }
  }

  const role = requireText(input.role, ACCESS_LABELS.role, FIELD_LIMITS.role)
  if (typeof role !== 'string') return role

  const organisation = requireText(input.organisation, ACCESS_LABELS.organisation, FIELD_LIMITS.organisation)
  if (typeof organisation !== 'string') return organisation

  const organisation_type = typeof input.organisation_type === 'string' ? input.organisation_type.trim().toLowerCase() : ''
  if (!ORG_TYPES.includes(organisation_type as OrgType)) {
    return { ok: false, error: 'Choose an organisation type.' }
  }

  let organisation_type_other: string | null = null
  if (organisation_type === 'other') {
    const specified = requireText(
      input.organisation_type_other,
      ACCESS_LABELS.organisation_type_other,
      FIELD_LIMITS.other_specify,
    )
    if (typeof specified !== 'string') return specified
    organisation_type_other = specified
  }

  const city = requireText(input.city, ACCESS_LABELS.city, FIELD_LIMITS.city)
  if (typeof city !== 'string') return city

  const linkedin_url = normalizeLinkedInUrl(input.linkedin_url)
  if (!linkedin_url) {
    return { ok: false, error: 'Enter a LinkedIn page URL (profile or company).' }
  }

  const chipsRaw = Array.isArray(input.mirror_for) ? input.mirror_for : []
  const mirror_for = [...new Set(chipsRaw.map((chip) => String(chip).trim()))].filter((chip) =>
    MIRROR_FOR_CHIPS.includes(chip as MirrorForChip),
  ) as MirrorForChip[]
  if (mirror_for.length === 0) {
    return { ok: false, error: 'Choose at least one Mirror use.' }
  }

  let mirror_for_other: string | null = null
  if (mirror_for.includes('other')) {
    const specified = requireText(
      input.mirror_for_other,
      ACCESS_LABELS.mirror_for_other,
      FIELD_LIMITS.other_specify,
    )
    if (typeof specified !== 'string') return specified
    mirror_for_other = specified
  }

  const use_sentence = requireText(input.use_sentence, ACCESS_LABELS.use_sentence, FIELD_LIMITS.use_sentence)
  if (typeof use_sentence !== 'string') return use_sentence

  if (input.attest_rehearsal_only !== true) {
    return { ok: false, error: 'Confirm that the Mirror stays free of real patient records.' }
  }
  if (input.attest_not_certification !== true) {
    return { ok: false, error: 'Confirm that this is not certification.' }
  }
  if (input.attest_authorised !== true) {
    return { ok: false, error: 'Confirm that you are authorised to request access.' }
  }
  if (input.contact_ok !== true) {
    return { ok: false, error: 'Confirm that we may contact you about this access request.' }
  }

  return {
    ok: true,
    value: {
      full_name,
      work_email,
      role,
      organisation,
      organisation_type: organisation_type as OrgType,
      organisation_type_other,
      city,
      linkedin_url,
      mirror_for,
      mirror_for_other,
      use_sentence,
      attest_rehearsal_only: true,
      attest_not_certification: true,
      attest_authorised: true,
      contact_ok: true,
    },
  }
}
