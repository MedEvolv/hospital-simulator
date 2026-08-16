/**
 * Access intake for the Institutional Mirror rehearsal door.
 *
 * Must fields only. Not certification. Not a score. Not a named corpus.
 */

export const ORG_TYPES = [
  'hospital',
  'lab',
  'insurer',
  'vendor',
  'researcher',
  'other',
] as const

export type OrgType = (typeof ORG_TYPES)[number]

export const MIRROR_FOR_CHIPS = ['DPDP', 'NABH', 'CDSCO', 'SAHI', 'other'] as const

export type MirrorForChip = (typeof MIRROR_FOR_CHIPS)[number]

export const ACCESS_STATUSES = ['pending', 'approved', 'denied', 'revoked'] as const

export type AccessStatus = (typeof ACCESS_STATUSES)[number]

export const FIELD_LIMITS = {
  full_name: 80,
  role: 60,
  organisation: 80,
  city: 40,
  use_sentence: 400,
  other_specify: 40,
  deny_reason: 200,
  linkedin_url: 200,
} as const

export const ACCESS_LABELS = {
  full_name: 'Name',
  work_email: 'Email',
  role: 'Position',
  organisation: 'Company',
  organisation_type: 'Type',
  organisation_type_other: 'Specify type',
  city: 'City',
  linkedin_url: 'LinkedIn page',
  mirror_for: 'What you want the Mirror for',
  mirror_for_other: 'Specify what the Mirror is for',
  use_sentence: 'In one or two sentences, what will you rehearse?',
} as const

export const ACCESS_COPY = {
  intro:
    'Request access. We read these answers only to open or refuse this door, and to reach you about this request. We do not train on them. We do not score you.',
  received:
    'Request received. If we need anything we will write to the email you gave. OTP opens only after access is approved.',
  notOpened: 'This email is not opened.',
  requestFirst: 'Request access first. OTP opens when access is approved.',
  alreadyOpened: 'This email is already opened. Request a code with the same work email.',
  setup:
    'Access requests are not open yet. Apply the mirror_access_requests migration. OTP is not sent until an email is approved.',
  otpPrivacy:
    'We use your email only to prove you can receive a code and open this door. We do not train on it. We do not score you. Synthetic scenarios stay synthetic.',
  erasure:
    'To delete this request, write from the same email. Approved access is revoked when the row is erased.',
  noticePurpose:
    'We use these answers only to decide whether to open the rehearsal door for this email, and to write to you about this request. Not a newsletter. Not a product list.',
  noticeDoorMail:
    'A one-time code is sent only after this email is approved, and only when you ask for it. Reaching out about this request is not the same as opening the door.',
  tickRecords:
    'I will not enter real patient records, reports, names, phone numbers, or other identifiers into the Mirror. Scenarios stay synthetic.',
  tickCert:
    'I understand this is alignment rehearsal. It is not NABH, CDSCO, or SAHI certification, and not a claim that ArchLife certifies my institution.',
  tickAuthorised:
    'I am asking for the rehearsal door for this work email, and I am authorised to ask.',
  tickContact: 'You may contact me at this email and LinkedIn about this access request.',
  alreadyApproved: 'Already approved? Open with a code',
  backToIntake: 'Request access instead',
  outreachNote: 'Write to them from this card. Reaching out does not approve the door.',
} as const

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  hospital: 'Hospital',
  lab: 'Lab',
  insurer: 'Insurer',
  vendor: 'Vendor',
  researcher: 'Researcher',
  other: 'Other',
}

export interface AccessRow {
  id: string
  work_email: string
  full_name: string
  role: string
  organisation: string
  organisation_type: OrgType
  organisation_type_other: string | null
  city: string
  linkedin_url: string
  mirror_for: MirrorForChip[]
  mirror_for_other: string | null
  use_sentence: string
  attest_rehearsal_only: boolean
  attest_not_certification: boolean
  attest_authorised: boolean
  contact_ok: boolean
  status: AccessStatus
  deny_reason: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
  denied_at: string | null
  revoked_at: string | null
}

export interface IntakeInput {
  full_name: string
  work_email: string
  role: string
  organisation: string
  organisation_type: string
  organisation_type_other?: string
  city: string
  linkedin_url: string
  mirror_for: string[]
  mirror_for_other?: string
  use_sentence: string
  attest_rehearsal_only: boolean
  attest_not_certification: boolean
  attest_authorised: boolean
  contact_ok: boolean
}

export const TABLE_MISSING = 'table_missing' as const
export type LookupResult =
  | { kind: 'row'; row: AccessRow }
  | { kind: 'missing' }
  | { kind: typeof TABLE_MISSING }
