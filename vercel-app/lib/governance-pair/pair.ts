/**
 * Knowledge-layer of the estate HRM pair (Advisor then Auditor).
 *
 * Canonical Python: 03_Systems/R-Daneel/healthcare_governance.py
 * Doctrine file: ./governance-policy.json (same signals, baseline, tiers, checklists).
 *
 * DeepSeek stays off. No API keys in this module. Tier classification is
 * deterministic. The Decision Lattice remains the enforcer; this module
 * classifies and reports. It does not write Axis A/B into GLP, STI, or
 * objective_value.
 */

import type { ScenarioConfig } from '@/lib/scenarios/schema'
import {
  attachCitations,
  type InstrumentCitation,
} from './citations'
import policy from './governance-policy.json'

type InstrumentKey = keyof typeof INSTRUMENT_LABELS

const INSTRUMENT_LABELS = {
  'instrument--dpdp-act-2023': 'DPDP Act 2023 + Rules 2025',
  'instrument--cdsco-medical-device-rules': 'CDSCO / Medical Device Rules 2017',
  'instrument--telemedicine-guidelines-2020': 'Telemedicine Guidelines 2020',
  'instrument--sahi-2026': 'SAHI (Strategy for AI in Healthcare, Feb 2026)',
  'instrument--icmr-ai-ethics-2023': 'ICMR Ethical Guidelines for AI (2023)',
  'instrument--nhrp-2026': 'NHRP 2026 (DHR draft, not gazette)',
  'instrument--naidm-2026': 'NAIDM / NMC AI-Literacy Line (2026)',
  'instrument--abdm': 'ABDM (exchange floor: UHI, NHCX, registries)',
  'instrument--bodh-2026': 'BODH (SAHI/PIB voluntary benchmark, Feb 2026)',
  'instrument--nabh-digital-health-standards': 'NABH Digital Health Standards (2nd Ed, 2025)',
  'instrument--meity-indiaai': 'MeitY IndiaAI Mission + Horizontal AI Policy',
} as const

const PILLARS: Record<string, string> = {
  C1: 'Lifecycle Regulation — the device approved must be the device operating.',
  C2: 'Health-Data Governance — consent must cover the actual use, including AI training.',
  C3: 'Validation Infrastructure — standing, funded, public validation, not one-off claims.',
  C4: 'Oversight Realism — human-in-the-loop degrades; supervision theater is a failure mode.',
  C5: 'Outcome Measurement — scores are not outcomes.',
}

const GAPS: Record<string, string> = {
  gap1: 'Implementation Cliff — no institution translates national policy into hospital-level practice.',
  gap2: 'Generative AI Blind Spot — validation built for classical ML cannot see hallucination.',
  gap3: 'Participation Deficit — ward staff, patients, ASHA workers absent from governance design.',
  gap4: 'Agentic Horizon — no vocabulary for AI that acts, not just outputs.',
}

const INSTRUMENT_PILLARS: Record<string, string[]> = {
  'instrument--dpdp-act-2023': ['C2', 'C4'],
  'instrument--cdsco-medical-device-rules': ['C1'],
  'instrument--telemedicine-guidelines-2020': ['C1', 'C4'],
  'instrument--sahi-2026': ['C1', 'C2', 'C3', 'C4'],
  'instrument--icmr-ai-ethics-2023': ['C4', 'C2'],
  'instrument--nhrp-2026': ['C3', 'C5'],
  'instrument--naidm-2026': ['C4'],
  'instrument--abdm': ['C2'],
  'instrument--bodh-2026': ['C3'],
  'instrument--nabh-digital-health-standards': ['C1', 'C4'],
  'instrument--meity-indiaai': ['C1', 'C2', 'C3'],
}

const INSTRUMENT_GAPS: Record<string, string[]> = {
  'instrument--dpdp-act-2023': ['gap2', 'gap4'],
  'instrument--cdsco-medical-device-rules': ['gap1', 'gap2'],
  'instrument--telemedicine-guidelines-2020': ['gap2'],
  'instrument--sahi-2026': ['gap1', 'gap4'],
  'instrument--icmr-ai-ethics-2023': ['gap2'],
  'instrument--nhrp-2026': ['gap3'],
  'instrument--naidm-2026': ['gap3'],
  'instrument--abdm': ['gap4'],
  'instrument--bodh-2026': ['gap2', 'gap3'],
  'instrument--nabh-digital-health-standards': ['gap1'],
  'instrument--meity-indiaai': ['gap1'],
}

const TIER_NAME: Record<string, string> = {
  T0: 'Autonomous',
  T1: 'Confirmable',
  T2: 'Human-required',
  T3: 'Prohibited',
}

export interface AdvisorResult {
  model: 'GovernanceAdvisor (H)'
  situation: string
  audited: boolean
  instruments: string[]
  instrument_keys: string[]
  pillars: string[]
  pillar_notes: Record<string, string>
  gaps: string[]
  gap_notes: Record<string, string>
  plan: string[]
  engine: 'knowledge-layer'
  audited_step_count?: number
  citations: InstrumentCitation[]
}

export interface AuditorResult {
  model: 'DecisionAuditor (L)'
  action: string
  op: string
  tier: string
  tier_name: string
  checklist: string[]
  verify: string
  equilibrium: 'reported'
}

export interface AuditedStep {
  step: number
  action: string
  tier: string
  verify: string
  equilibrium: true
}

export interface PairResult {
  advisor: AdvisorResult
  audited_steps: AuditedStep[]
}

function loadKnowledge(): { signals: Record<string, string[]>; baseline: { always_ai: string[]; patient_data: string[] } } {
  return {
    signals: policy.signals as Record<string, string[]>,
    baseline: policy.baseline as { always_ai: string[]; patient_data: string[] },
  }
}

function validateCitations(names: string[]): string[] {
  return names.filter((n) => n in INSTRUMENT_LABELS)
}

function composePlan(instruments: string[]): string[] {
  const steps: string[] = []
  if (instruments.includes('instrument--dpdp-act-2023')) {
    steps.push('Audit the consent basis for any data the deployment processes or trains on (DPDP: unbundled consent).')
  }
  if (instruments.includes('instrument--bodh-2026') || instruments.includes('instrument--nhrp-2026')) {
    const bits: string[] = []
    if (instruments.includes('instrument--nhrp-2026')) {
      bits.push('NHRP Section 4.6.4.1 is a DHR draft SHALL, not a funded centre')
    }
    if (instruments.includes('instrument--bodh-2026')) {
      bits.push('BODH is a voluntary SAHI/PIB benchmark, not a gate and not Eka Care BODHI-S/M')
    }
    steps.push(`Record local validation evidence the hospital actually holds. ${bits.join('. ')}.`)
  }
  if (instruments.includes('instrument--sahi-2026')) {
    steps.push('Name a governance owner and an escalation path (SAHI Rec 19 + Rec 22).')
  }
  if (instruments.includes('instrument--cdsco-medical-device-rules')) {
    steps.push('Determine whether the tool meets the SaMD definition; if unclear, document the grey-zone decision (CDSCO).')
  }
  if (instruments.includes('instrument--abdm')) {
    steps.push('Separate exchange from behaviour: ABDM (UHI, NHCX, registries) moves records and claims; it does not govern model behaviour. Consent Monday stays DPDP.')
  }
  if (instruments.includes('instrument--nabh-digital-health-standards')) {
    steps.push('Map the deployment into NABH digital-health documentation before the next accreditation cycle.')
  }
  if (steps.length === 0) {
    steps.push('Start an instrument review: which of the 11 cards apply to this situation.')
  }
  const monday = 'Land at Monday: one named owner, one first action, one logged decision.'
  return [...steps.slice(0, 4), monday]
}

export function advise(situation: string): AdvisorResult {
  const knowledge = loadKnowledge()
  const low = situation.toLowerCase()
  const hits = new Set<string>()

  const aiMarkers = ['ai', 'llm', 'model', 'machine learning', 'ml ', 'algorithm']
  if (aiMarkers.some((m) => low.includes(m))) {
    for (const k of knowledge.baseline.always_ai) hits.add(k)
  }

  const dataMarkers = ['patient', 'personal data', 'x-ray', 'records', 'data']
  if (dataMarkers.some((m) => low.includes(m))) {
    for (const k of knowledge.baseline.patient_data) hits.add(k)
  }

  for (const [signal, instruments] of Object.entries(knowledge.signals)) {
    if (low.includes(signal)) {
      for (const inst of instruments) hits.add(inst)
    }
  }

  if (/\bbodh\b/.test(low)) {
    hits.add('instrument--bodh-2026')
  }
  if (/\bbodhi(?:-s|-m)?\b/.test(low) && !/\bbodh\b/.test(low)) {
    hits.delete('instrument--bodh-2026')
  }
  if (/\bdpdp\b/.test(low)) {
    hits.add('instrument--dpdp-act-2023')
  }
  if (/\b(?:mdr|cdsco)\b/.test(low)) {
    hits.add('instrument--cdsco-medical-device-rules')
  }
  if (/\babdm\b/.test(low)) {
    hits.add('instrument--abdm')
  }
  if (/\bnabh\b/.test(low)) {
    hits.add('instrument--nabh-digital-health-standards')
  }

  const instruments = validateCitations([...hits].sort())
  const pillars = new Set<string>()
  const gaps = new Set<string>()
  for (const inst of instruments) {
    for (const p of INSTRUMENT_PILLARS[inst] ?? []) pillars.add(p)
    for (const g of INSTRUMENT_GAPS[inst] ?? []) gaps.add(g)
  }

  const pillarList = [...pillars].sort()
  const gapList = [...gaps].sort()
  const pillarNotes: Record<string, string> = {}
  for (const p of pillarList) pillarNotes[p] = PILLARS[p]
  const gapNotes: Record<string, string> = {}
  for (const g of gapList) gapNotes[g] = GAPS[g]
  const cited = attachCitations(instruments)

  return {
    model: 'GovernanceAdvisor (H)',
    situation,
    audited: false,
    instruments: instruments.map((i) => INSTRUMENT_LABELS[i as InstrumentKey] ?? i),
    instrument_keys: instruments,
    pillars: pillarList,
    pillar_notes: pillarNotes,
    gaps: gapList,
    gap_notes: gapNotes,
    plan: composePlan(instruments),
    engine: 'knowledge-layer',
    citations: cited.citations,
  }
}

function toOp(action: string): string {
  const low = action.toLowerCase()
  if (low.includes('train on real') || low.includes('without consent')) {
    return 'patient_data_train'
  }
  if (['patient data', 'access patient', 'personal-documents', 'scrape'].some((k) => low.includes(k))) {
    return 'patient_data_access'
  }
  if (['publish', 'deploy the', 'deploying', 'deploy a', 'commit a signed', 'name a hospital'].some((k) => low.includes(k))) {
    return low.includes('publish') ? 'publish_public' : 'deploy'
  }
  if (['contact', 'share', 'push', 'follow-up', 'paid model'].some((k) => low.includes(k))) {
    return low.includes('release') ? 'packet_release' : 'push_non_main'
  }
  if (low.includes('modify a signed')) {
    return 'modify_adr'
  }
  return 'safe_write'
}

function classify(op: string): string {
  const tiers = policy.tiers as {
    T1: { ops: string[] }
    T2: { ops: string[] }
    T3: { ops: string[] }
  }
  if (tiers.T3.ops.includes(op)) return 'T3'
  if (tiers.T2.ops.includes(op)) return 'T2'
  if (tiers.T1.ops.includes(op)) return 'T1'
  return 'T0'
}

function checklistFor(action: string): string[] {
  const items: string[] = []
  const low = action.toLowerCase()
  const checklists = policy.checklists as Record<string, string[]>
  if (['patient', 'data', 'consent', 'record'].some((k) => low.includes(k))) {
    items.push(...(checklists.patient_data ?? []))
  }
  if (['deploy', 'tool', 'model', 'diagnostic'].some((k) => low.includes(k))) {
    items.push(...(checklists.deploy ?? []))
  }
  if (low.includes('publish')) {
    items.push(...(checklists.publish ?? []))
  }
  if (low.includes('contact') || low.includes('follow-up')) {
    items.push(...(checklists.contact ?? []))
  }
  if (items.length === 0) {
    items.push('SAHI: communication of use/limits/risk (Rec 6); escalation path exists (Rec 22).')
  }
  return items
}

function verifyStep(action: string): string {
  const low = action.toLowerCase()
  if (low.includes('publish')) {
    return 'verify: the publication text cites only instruments present in the curriculum (citation guard).'
  }
  if (low.includes('contact') || low.includes('follow-up')) {
    return 'verify: the message exists in drafts and names no partner without consent.'
  }
  if (['deploy the', 'deploying', 'deploy a', 'deploy to'].some((k) => low.includes(k))) {
    return 'verify: production smoke check passes on the sandbox before the deploy command runs.'
  }
  return 'verify: the action is logged in decisions.jsonl with tier and rationale.'
}

export function audit(action: string): AuditorResult {
  const op = toOp(action)
  const tier = classify(op)
  return {
    model: 'DecisionAuditor (L)',
    action,
    op,
    tier,
    tier_name: TIER_NAME[tier] ?? tier,
    checklist: checklistFor(action),
    verify: verifyStep(action),
    equilibrium: 'reported',
  }
}

export function analyze(situation: string): PairResult {
  const advice = advise(situation)
  const steps: AuditedStep[] = advice.plan.map((step, i) => {
    const audited = audit(step)
    return {
      step: i + 1,
      action: step,
      tier: audited.tier,
      verify: audited.verify,
      equilibrium: true,
    }
  })
  advice.audited = true
  advice.audited_step_count = steps.length
  return { advisor: advice, audited_steps: steps }
}

export function situationFromScenario(scenario: Pick<ScenarioConfig, 'name' | 'description'> & {
  aiSystems?: Array<{ name?: string; type?: string }>
}): string {
  const ai = (scenario.aiSystems ?? [])
    .map((s) => [s.name, s.type].filter(Boolean).join(' '))
    .filter(Boolean)
    .join('; ')
  return ai
    ? `${scenario.name}. ${scenario.description} AI in scope: ${ai}.`
    : `${scenario.name}. ${scenario.description}`
}

/** Product-path entry: Advisor then Auditor on a scenario. */
export function pairForScenario(scenario: Pick<ScenarioConfig, 'name' | 'description'> & {
  aiSystems?: Array<{ name?: string; type?: string }>
}): PairResult {
  return analyze(situationFromScenario(scenario))
}
