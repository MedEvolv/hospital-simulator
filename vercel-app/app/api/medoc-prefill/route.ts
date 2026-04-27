/**
 * GET /api/medoc-prefill
 *
 * HIS integration endpoint — Medoc or a similar system can call this to
 * pre-populate the Institutional Mirror survey without requiring manual user
 * input. Returns a JSON object that matches the `im_survey` sessionStorage
 * structure consumed by the survey page and the generate-report API.
 *
 * Query parameters (all optional — defaults applied for any missing field):
 *   nabh_status          "entry_level" | "full_first" | "full_renewed" |
 *                        "lapsed" | "pursuing" | "not_pursuing"
 *   bed_count            integer — used to derive institution_type if not supplied
 *   occupancy_rate       float 0.0–1.0 — sets the profile hint
 *   weakest_chapters     comma-separated NABH chapter codes, e.g. "PSQ,PRE"
 *   ethics_committee     "yes" | "no"
 *   ai_maturity          "paper_only" | "basic_his" | "his_integrated" |
 *                        "his_telemedicine" | "ai_cdss" | "ai_integrated"
 *   incident_register    "yes" | "no"
 *   his_type             free string — maps to digital_maturity if ai_maturity not given
 *   institution_type     "government" | "private" | "trust" | "teaching" | "other"
 *
 * Response shape mirrors the im_survey sessionStorage object (Record<string, string | string[]>).
 * The frontend survey page stores this object verbatim, and the simulation
 * endpoint reads it as survey_data — so pre-populating it here has the same
 * effect as a user completing the survey manually.
 *
 * Usage example (Medoc integration):
 *   const url = `https://your-deployment.vercel.app/api/medoc-prefill?` +
 *     `nabh_status=entry_level&weakest_chapters=PSQ,PRE&` +
 *     `ethics_committee=no&ai_maturity=basic_his&incident_register=yes`
 *   const survey = await fetch(url).then(r => r.json())
 *   // Store in sessionStorage on the user's browser and redirect to /?profile=...
 *   sessionStorage.setItem('im_survey', JSON.stringify(survey.survey_data))
 */

// ── NABH chapter validation ───────────────────────────────────────────────────

const VALID_NABH_CHAPTERS = new Set([
  'AAC', 'COP', 'MOM', 'PRE', 'IPC',
  'PSQ', 'ROM', 'FMS', 'HRM', 'IMS',
])

const VALID_NABH_STATUSES = new Set([
  'entry_level', 'full_first', 'full_renewed',
  'lapsed', 'pursuing', 'not_pursuing',
])

const VALID_DIGITAL_MATURITY = new Set([
  'paper_only', 'basic_his', 'his_integrated',
  'his_telemedicine', 'ai_cdss', 'ai_integrated',
])

// ── Map HIS type string → digital_maturity value ─────────────────────────────

function hisTypeToMaturity(hisType: string): string {
  const t = hisType.toLowerCase()
  if (t.includes('medoc') || t.includes('ai') || t.includes('integrated')) return 'ai_integrated'
  if (t.includes('cdss') || t.includes('clinical decision')) return 'ai_cdss'
  if (t.includes('tele')) return 'his_telemedicine'
  if (t.includes('lab') || t.includes('pharmacy')) return 'his_integrated'
  if (t.includes('billing') || t.includes('registration')) return 'basic_his'
  if (t.includes('paper') || t.includes('manual') || t.includes('none')) return 'paper_only'
  return 'basic_his'  // safe default
}

// ── Derive institution type from bed count ────────────────────────────────────

function bedCountToInstitutionType(beds: number): string {
  if (beds >= 500) return 'teaching'
  if (beds >= 150) return 'private'
  return 'government'
}

// ── Build governance_infra array from known flags ─────────────────────────────

function buildGovernanceInfra(
  ethicsCommittee: boolean,
  incidentRegister: boolean,
): string[] {
  const infra: string[] = []
  if (incidentRegister) infra.push('adverse_event_register')
  if (ethicsCommittee)  infra.push('ethics_committee')
  if (infra.length === 0) infra.push('none')
  return infra
}

// ── Infer ai_readiness scale (1–5) from digital maturity ─────────────────────

function maturityToAiReadiness(maturity: string): string {
  const map: Record<string, string> = {
    paper_only:      '1',
    basic_his:       '2',
    his_integrated:  '3',
    his_telemedicine:'3',
    ai_cdss:         '4',
    ai_integrated:   '5',
  }
  return map[maturity] ?? '2'
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  // ── Parse query parameters ───────────────────────────────────────────────
  const rawNabhStatus       = searchParams.get('nabh_status')      ?? ''
  const rawBedCount         = parseInt(searchParams.get('bed_count') ?? '0', 10)
  const rawOccupancyRate    = parseFloat(searchParams.get('occupancy_rate') ?? '0.7')
  const rawWeakestChapters  = searchParams.get('weakest_chapters')  ?? ''
  const rawEthicsCommittee  = searchParams.get('ethics_committee')  ?? 'no'
  const rawAiMaturity       = searchParams.get('ai_maturity')       ?? ''
  const rawIncidentRegister = searchParams.get('incident_register') ?? 'no'
  const rawHisType          = searchParams.get('his_type')          ?? ''
  const rawInstitutionType  = searchParams.get('institution_type')  ?? ''

  // ── Validate and normalise ───────────────────────────────────────────────

  // NABH status
  const nabh_status = VALID_NABH_STATUSES.has(rawNabhStatus)
    ? rawNabhStatus
    : 'not_pursuing'

  // Weakest chapters — max 2, validated against known codes
  const nabh_weakest_chapters = rawWeakestChapters
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(c => VALID_NABH_CHAPTERS.has(c))
    .slice(0, 2)

  // Digital maturity: prefer explicit ai_maturity param, fall back to his_type mapping
  const digital_maturity = VALID_DIGITAL_MATURITY.has(rawAiMaturity)
    ? rawAiMaturity
    : rawHisType
    ? hisTypeToMaturity(rawHisType)
    : 'basic_his'

  // Boolean flags
  const hasEthics   = rawEthicsCommittee.toLowerCase()  === 'yes'
  const hasRegister = rawIncidentRegister.toLowerCase() === 'yes'

  // Institution type: prefer explicit param, fall back to bed count
  const institution_type = ['government', 'private', 'trust', 'teaching', 'other'].includes(rawInstitutionType)
    ? rawInstitutionType
    : rawBedCount > 0
    ? bedCountToInstitutionType(rawBedCount)
    : 'government'

  // Profile hint for the simulation
  const profile = institution_type === 'government'
    ? 'Government Hospital'
    : institution_type === 'private'
    ? 'Private Hospital'
    : 'Balanced'

  // Governance infrastructure
  const governance_infra = buildGovernanceInfra(hasEthics, hasRegister)

  // AI readiness scale
  const ai_readiness = maturityToAiReadiness(digital_maturity)

  // ── Build survey object ──────────────────────────────────────────────────
  //
  // This object matches the im_survey sessionStorage structure.
  // Multi-select fields are string[]; single-select fields are string.
  // The frontend treats this object as if the user completed the survey manually.
  //
  const survey_data: Record<string, string | string[]> = {
    // Section 1
    institution_type,

    // Section 2 — NABH context
    nabh_status,
    ...(nabh_weakest_chapters.length > 0 && { nabh_weakest_chapters }),
    digital_maturity,
    governance_infra,

    // Section 3 — Governance priorities (inferred from HIS/AI maturity)
    ai_readiness,

    // Section 4 — Values (neutral defaults — no HIS data to infer these)
    // Left as empty strings so the survey page treats them as unanswered
    // The user should complete these sections manually
  }

  // ── Metadata for debugging / logging ────────────────────────────────────
  const meta = {
    source:           'medoc-prefill',
    api_version:      '1.0',
    prefill_fields:   Object.keys(survey_data),
    manual_fields:    ['role', 'values_priority', 'harm_tolerance', 'refusal_view',
                       'human_override', 'top_concern', 'primary_use', 'open_comment'],
    profile_hint:     profile,
    occupancy_rate:   rawOccupancyRate,
    bed_count:        rawBedCount || null,
    integration_note: 'Pre-populate sessionStorage[\'im_survey\'] with survey_data, ' +
                      'then redirect to /?profile=' + encodeURIComponent(profile) +
                      ' to launch the simulator with this institution\'s context.',
  }

  return Response.json({
    survey_data,
    meta,
  })
}
