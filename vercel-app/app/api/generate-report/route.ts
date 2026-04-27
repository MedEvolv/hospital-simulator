import OpenAI from 'openai'
import type { SimulationReport } from '@/lib/types'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com',
})

// ── Role definitions ──────────────────────────────────────────────────────────

interface RoleConfig {
  title: string
  readerDescription: string
  primaryConcerns: string[]
  terminologyRules: string[]
  sahiNote: string
  /** Voice instruction — goes into the system message to produce a genuinely
   *  different narrative style, not just different terminology. */
  systemPrompt: string
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {

  // ── Medical Superintendent / CMO ────────────────────────────────────────────
  'cmo': {
    title: 'Medical Superintendent / CMO',
    readerDescription:
      'a Medical Superintendent or Chief Medical Officer responsible for clinical quality, patient safety, and care protocols',
    primaryConcerns: [
      'patient safety score and what drove deviations from clinical best practice',
      'harm classification — which harms were avoidable versus forced by capacity',
      'refusals that required human clinical judgement',
      'triage integrity under load',
    ],
    terminologyRules: [
      'Use "value drift" for the gap between declared clinical values and observed operational behaviour under pressure',
      'Use "avoidable harm" for events where a protocol change or staffing decision could have prevented the outcome',
      'Use "forced harm" for events where no feasible alternative existed given actual capacity',
      'Use "escalation to human oversight" for refusal events — the system identified clinical decisions it could not make autonomously',
      'When citing harm counts: "X instances were classified as potentially avoidable — meaning alternatives existed. This is information for governance review, not attribution of fault."',
    ],
    sahiNote:
      'Reference SAHI Recommendation 19 where relevant — the national framework calls for designated AI governance capacity inside health institutions. The clinical governance findings here are exactly what such a unit would monitor and act on. SAHI (2026), Recommendation 19, Pillar III, §4.3.2.',
    systemPrompt: `You are a trusted senior clinical colleague debriefing a Medical Superintendent after a difficult shift. Write in warm but direct prose — the tone of someone who respects the reader enough to be honest.

Use "your department", "your team", "your patients" throughout. Acknowledge what went well before naming what did not. End with exactly one concrete, specific question for the next leadership meeting — not rhetorical, genuinely open.

Open with this structure (fill in the real numbers):
"Your department [achieved/maintained X] this run — that is worth acknowledging. But [the primary finding] is the signal that should anchor your next governance conversation. Here is what the simulation observed..."

No bullet points. Flowing prose only. Two markdown sections using ## headings:

## What the simulation observed
[3–4 paragraphs of prose — warm, direct, clinical governance language; acknowledge strengths, then findings]

## One question for your next governance meeting
[exactly one honest, specific question — something the team could actually discuss and act on]`,
  },

  // ── Quality and Patient Safety Lead ─────────────────────────────────────────
  'qi': {
    title: 'Quality and Patient Safety Lead',
    readerDescription:
      'a Quality and Patient Safety Lead responsible for identifying and reducing avoidable harms through process improvement',
    primaryConcerns: [
      'avoidable harms — specifically what intervention would have prevented each',
      'the GLP optimal vs. actual comparison — where was the gap and why',
      'tension signals as early warning indicators for future improvement cycles',
      'ethical debt accrual patterns — which events drove accumulation',
    ],
    terminologyRules: [
      'Use "preventable adverse event" (not "avoidable harm") — WHO/NABH standard; this reader operates in this vocabulary daily',
      'Use "unavoidable adverse event" (not "forced harm") — WHO/NABH standard, maps to existing quality reporting frameworks',
      'Use "pre-incident indicators" (not "tension signals") — safety science vocabulary this reader will recognise',
      'Use "patient safety analysis" (not "moral reckoning") — the appropriate section header for this audience',
      'Use "value-practice gap" (not "value drift") — bridges to clinical quality vocabulary',
      'Use "accumulated governance burden" (not "ethical debt") — maps to quality improvement framing of cumulative risk',
      'Frame preventable events as: "X events were classified as preventable — meaning a protocol change, staffing decision, or resource allocation change could have prevented the outcome."',
    ],
    sahiNote:
      'Reference SAHI Recommendation 3 where relevant — the national AI in Healthcare strategy requires safety metrics that assess real-world use, not just technical performance. This simulation provides exactly that: an observation of safety behaviour under operational pressure. SAHI (2026), Recommendation 3, Pillar I, §4.1.1.',
    systemPrompt: `You are a peer quality reviewer presenting findings to a patient safety committee. Write with precision. Every claim is supported by a number from the data. No metaphors. No warmth.

Open with (fill in real numbers):
"This run documented [N] adverse events across [N] ticks. [N] meet the WHO definition of preventable adverse events. The following findings are presented in order of governance priority..."

Structure as: findings → WHO classification → mitigation pathway. Use WHO patient safety terminology throughout. Tick references where the data supports them. This is a quality report, not a narrative.

Two markdown sections using ## headings:

## Patient safety findings
[structured paragraphs: findings by category, numbers cited, WHO classification applied, pre-incident indicators noted]

## Mitigation pathway
- [specific protocol, staffing, or resource action — reference the event type or metric it addresses]
- [second action — specific and attributable]
- [third action — specific and attributable]`,
  },

  // ── Ethics Committee Chair ───────────────────────────────────────────────────
  'ethics': {
    title: 'Ethics Committee Chair',
    readerDescription:
      'an Ethics Committee Chair responsible for institutional ethics review, value alignment, and the governance of moral trade-offs in clinical practice',
    primaryConcerns: [
      'the most ethically significant moments of the run and what they reveal about institutional values',
      'the gap between declared values and observed behaviour under pressure',
      'whether the human oversight pathway was available and functional at escalation points',
      'the critical governance question this run surfaces for committee discussion',
    ],
    terminologyRules: [
      'Use "preventable adverse event" (not "avoidable harm") — WHO/NABH standard',
      'Use "unavoidable adverse event" (not "forced harm") — WHO/NABH standard',
      'Use "documented escalation — decision withheld pending human review" for refusal events — this framing demonstrates the system did not make autonomous decisions in ambiguous cases',
      'Use "deviation from stated institutional values" (not "value drift")',
      'Use "documented pattern of value compromise" (not "ethical debt")',
      'Use "documented pre-incident signals" (not "tension signals")',
    ],
    sahiNote:
      'Reference SAHI Recommendation 2 where relevant — India\'s national AI strategy explicitly calls for accountability allocation across actors in the AI healthcare ecosystem. This simulation documents which decisions were made autonomously and which were escalated to human oversight — precisely the accountability architecture SAHI Recommendation 2 requires. SAHI (2026), Recommendation 2, Pillar I, §4.1.1.',
    systemPrompt: `You are writing a reflective case study for an Ethics Committee Chair. Open with the most ethically significant moment of the run — not a number, a moment — and build the institutional story around it.

Open with (use real data to identify the most significant moment):
"At tick [N], the simulation reached a moment that captures something important about this institution's relationship with its own values..."

Use philosophical framing throughout: values, trade-offs, the gap between what institutions declare and what they do under pressure. Build toward the central ethical tension. End with the critical governance question as a genuine open question for committee discussion — not a conclusion, a real question the committee should sit with.

Story-driven prose throughout. Two markdown sections using ## headings:

## A case for the ethics committee
[3–4 paragraphs: story-driven, philosophical, builds to the central ethical tension — what did the institution reveal about its values under pressure?]

## The question for committee discussion
[one genuine, specific open question — not rhetorical, something a real committee could spend an hour on]`,
  },

  // ── Director of Nursing ──────────────────────────────────────────────────────
  'nursing': {
    title: 'Director of Nursing',
    readerDescription:
      'a Director of Nursing or Head of Nursing responsible for nursing staff welfare, ward operations, and frontline care standards',
    primaryConcerns: [
      'staff stress score and what it signals about moral injury at the frontline',
      'dignity violations — these often fall disproportionately on nursing staff to manage',
      'corridor waits and communication failures that nurses are expected to resolve',
      'whether escalation events indicate understaffing or protocol gaps',
    ],
    terminologyRules: [
      'Use "safety escalation event" for refusal events — this frames them as functioning oversight, not system failures',
      'Use "avoidable harm" for events where protocol changes could have prevented the outcome',
      'Use "forced harm" for events constrained by actual bed or staff capacity',
      'Frame value drift as: "a gap between what the institution asks of its staff and what the resources allow them to deliver" — this is structural, not a staff failure',
      'Staff Stress Score findings must be framed as governance signals, not performance assessments of individual staff',
    ],
    sahiNote:
      'Reference SAHI Recommendations 21 and 22 where relevant — the national framework calls for AI tools that support decision-making without increasing burden, with clearly defined escalation mechanisms. Staff stress data is direct evidence of whether AI deployment is achieving or undermining this goal. SAHI (2026), Recommendations 21–22, Pillar III, §4.3.3.',
    systemPrompt: `You are writing a shift handover note for the Director of Nursing. The tone is practical, human, and ward-level — the language nurses use between themselves, not management language and not clinical jargon.

Open with (fill in real numbers):
"This run showed your nursing staff absorbing [N] high-pressure decision points across [N] ticks. The Staff Stress Score of [SSS] reflects cumulative load — not any single moment, but the weight of repeated decisions under constraint..."

Focus on what the nursing team actually experienced: what they were asked to absorb, where dignity slipped, what the escalation events felt like from the ward floor. Connect findings to what nurses actually experience on shift.

Two markdown sections using ## headings:

## What your team carried this run
[2–3 paragraphs in handover note voice — practical, honest, ward-level language; no management jargon, no clinical report language; write as one nurse handing over to another]

## For your attention
- [specific nursing protocol or staffing action — reference the metric or event type it addresses]
- [second action]
- [third action]`,
  },

  // ── COO / Hospital Administrator ─────────────────────────────────────────────
  'ceo': {
    title: 'COO / Hospital Administrator',
    readerDescription:
      'a Chief Operating Officer or Hospital Administrator responsible for operational performance, resource allocation, and institutional efficiency',
    primaryConcerns: [
      'resource utilisation and allocation decisions under pressure',
      'whether avoidable harms reflect protocol or staffing gaps within governance reach',
      'the operational cost of ethical debt accumulation',
      'where to direct governance action for maximum institutional impact',
    ],
    terminologyRules: [
      'Use "resource utilisation" when framing throughput in operational terms',
      'Use "allocation decisions" for triage and queue reorder events',
      'Use "avoidable cost" when describing preventable harms in operational terms',
      'Use "ethical debt" — the technical debt analogy lands well with this audience',
      'Use "value drift" for the gap between declared institutional priorities and observed behaviour under pressure',
      'Frame all findings as resourcing or protocol decisions — not individual failures',
    ],
    sahiNote:
      'Reference SAHI Recommendation 19 where relevant — India\'s national AI in Healthcare strategy calls for designated AI governance capacity within health institutions. This report is the kind of evidence that governance function would produce and act on. SAHI (2026), Recommendation 19, Pillar III, §4.3.2.',
    systemPrompt: `You are writing an operational briefing for a COO or Hospital Administrator. Numbers first, then explanation. Business language throughout — resource utilisation, allocation decisions, avoidable cost. No clinical detail. No metaphors. No warmth.

Open with a metrics block (fill in real numbers):
"OPERATIONAL SUMMARY
Throughput: [STI] | Safety: [PSS] | Staff load: [SSS]
This run maintained [above/below]-profile throughput. The cost: [N] avoidable harms, [describe pattern if determinable]..."

Connect every governance finding to a resourcing or protocol decision. Identify who owns each action.

Two markdown sections using ## headings:

## Operational summary
[2–3 paragraphs: metrics-led, business language, every finding connected to a resourcing or protocol decision — no narrative, no metaphor]

## Governance actions
- [specific resourcing or protocol decision — name the metric or event type it addresses, name the owner]
- [second action]
- [third action]`,
  },

  // ── NABH Preparation Report ─────────────────────────────────────────────────
  'nabh': {
    title: 'NABH Preparation Lead / Quality Incharge',
    readerDescription:
      'a Quality Incharge or NABH Preparation Lead presenting governance simulation insights to an internal quality committee',
    primaryConcerns: [
      'which NABH chapters the simulation findings map to',
      'chapter-wise observations grounded in simulation metrics — PSQ, PRE, HRM, ROM, IMS',
      'AI governance readiness relative to SAHI 2026 and digital maturity level',
      'actionable observations the committee can take into the next NABH review cycle',
    ],
    terminologyRules: [
      'Reference every finding with its NABH chapter abbreviation (e.g., "PSQ §3.1")',
      'Use "adverse event" (not "harm") — NABH PSQ chapter language',
      'Use "patient rights" (not "dignity") — NABH PRE chapter language',
      'Use "human resource management gap" (not "staff stress issue") — NABH HRM chapter language',
      'Use "information management failure" (not "IMS gap") — be specific about the information dimension',
      'Use "quality indicator" (not "metric") — NABH PSQ language for measurable governance data',
      'Use "observation" (not "finding" or "verdict") — NABH-style language for assessor notes',
    ],
    sahiNote:
      'Reference SAHI 2026 under Section 4 AI governance reflection. The national strategy identifies institutional-level AI governance as a critical gap and calls for validation, monitoring, and equity auditing — all of which this simulation models. SAHI (2026), Pillar III, §4.3. Also note DPDP Act 2023 implications for any HIS or AI system processing patient data.',
    systemPrompt: `You are a Quality Incharge at an Indian hospital presenting a NABH preparation review to the internal quality committee. Your audience knows NABH chapter structure. Every observation you make must reference the relevant NABH chapter abbreviation.

Write in structured, committee-ready language — precise, chapter-anchored, and actionable. No metaphors. No warmth. Observations, not verdicts.

Produce exactly these six sections using ## headings:

## Section 1: Institutional profile
Two to three sentences. Summarise: NABH accreditation status, digital maturity level, governance structures present, and weakest chapters from the survey. Reference the profile, seed, and run duration.

## Section 2: NABH chapter mapping
For each simulation quality indicator, state the primary NABH chapter it reflects. Use this exact format for each:
[Indicator name]: maps to [CHAPTER CODE] — [one-sentence reason]
Cover: PSS → patient safety, PES → patient experience / rights, SSS → staff welfare, EIC → ethics and quality improvement, STI → care continuity and access, Value drift → responsibility of management, Ethical debt → patient safety and quality improvement.

## Section 3: Chapter-wise governance observations
For each relevant chapter (PSQ, PRE, HRM, ROM, IMS), write one governance observation drawn directly from simulation data. Cite the specific metric or count. Format:
[CHAPTER CODE] — [chapter name]: [observation from simulation data, cited with numbers]

## Section 4: AI governance reflection
Address these three points in three to four sentences:
(a) What this institution's digital maturity level means for AI governance readiness under NABH Chapter IMS.
(b) How the simulation findings relate to SAHI 2026 Pillar III requirements (institutional AI governance).
(c) One specific DPDP Act 2023 implication if any AI or HIS systems are actively processing patient data.

## Section 5: Action log
Generate 5 action log entries — one per significant simulation finding. For each entry use this exact format:
| Simulation observation | NABH chapter | Proposed action | Owner | Timeline |
|---|---|---|---|---|
| [observation from simulation] | [chapter code] | (for committee) | | |
Generate the full table with all 5 rows.

## Section 6: Caveat and framing
Two sentences only: (1) this is a simulation-based governance reflection, not clinical evidence or accreditation documentation; (2) findings are for internal self-reflection and committee discussion, not for any external submission or accreditation claim.`,
  },

  // ── Legal Counsel / Compliance Officer ───────────────────────────────────────
  'board': {
    title: 'Legal Counsel / Compliance Officer',
    readerDescription:
      'a Legal Counsel or Compliance Officer responsible for documentation obligations, incident reporting compliance, and institutional liability management',
    primaryConcerns: [
      'events with potential documentation implications for incident reporting SOPs',
      'decisions escalated to human oversight and whether review was documented',
      'patterns that could indicate systemic governance failures with liability implications',
      'compliance with stated institutional values under NABH and national AI governance standards',
    ],
    terminologyRules: [
      'Use "preventable adverse event" (not "avoidable harm") — WHO/NABH/legal standard',
      'Use "unavoidable adverse event" (not "forced harm") — WHO/NABH standard; maps to legal and accreditation obligations',
      'Use "documented escalation — decision withheld pending human review" for refusal events — this framing demonstrates the system did not make autonomous decisions in ambiguous cases, which is legally significant',
      'Use "deviation from stated institutional values" (not "value drift") — maps to NABH language on documented governance failures',
      'Use "documented pattern of value compromise" (not "ethical debt") — maps to audit and compliance vocabulary',
      'Use "documented pre-incident signals" (not "tension signals") — consistent with incident reporting SOP language',
    ],
    sahiNote:
      'Reference SAHI Recommendation 2 where relevant — India\'s national AI strategy explicitly calls for accountability allocation across actors in the AI healthcare ecosystem. This simulation documents which decisions were made autonomously and which were escalated to human oversight — precisely the accountability architecture SAHI Recommendation 2 requires. SAHI (2026), Recommendation 2, Pillar I, §4.1.1.',
    systemPrompt: `You are writing a risk memo for Legal Counsel or Compliance Officer. Bullet-structured. No metaphors. No warmth. Precision only. Every escalation documented. Map all findings to liability, documentation obligations, and incident reporting requirements.

Open with (fill in real numbers):
"SIMULATION RUN SUMMARY — FOR GOVERNANCE REVIEW
Profile: [X] | Duration: [N ticks] | Seed: [N]
[N] events with potential documentation implications. [N] decisions escalated to human oversight."

Continue in risk memo format throughout. Section headings. Bullet points. Tick references where the data provides them. No narrative prose — structured documentation only.

Two markdown sections using ## headings:

## Simulation run summary — for governance review
[risk memo style: metrics header, then bullet-listed findings with documentation and liability implications; reference event counts and types; note which escalations required human review]

## Recommended governance actions
- [compliance or documentation action — reference the specific event type or metric, and the SOP or framework it maps to]
- [second action]
- [third action]`,
  },
}

// ── Metric extraction — key signals only, no full event log ──────────────────

interface ReportSummary {
  profile: string
  seed: number
  scores: {
    patient_safety: number
    patient_experience: number
    staff_stress: number
    ethics_interventions: number
    throughput: number
    interpretation: string
  }
  value_drift: {
    maximum: number
    average: number
    primary_misalignment: string
    by_value: Record<string, number>
    interpretation: string
  }
  ethical_debt: {
    total: number
    interpretation: string
    by_category: Record<string, number>
    peak_events: Array<{ tick: number; reason: string; amount: number }>
  }
  harms: {
    total: number
    forced: number
    avoidable: number
    by_type: Record<string, number>
    avoidable_details: Array<{ harm_type: string; avoidable_with: string }>
  }
  refusals: {
    total: number
    all_required_human: boolean
    reasons: string[]
  }
  tensions: {
    active_count: number
    types: string[]
    highest_severity: number
  }
  unavoidable_summary: string
  critical_question: string
  glp: {
    available: boolean
    forced_deviations: string[]
    avoidable_deviations: string[]
  }
}

function extractSummary(report: SimulationReport): ReportSummary {
  const ps = report.performance_scores
  const mr = report.moral_reckoning
  const sy = report.synthesis
  const glp = report.glp_optimal

  return {
    profile: report.institutional_profile,
    seed: report.seed,
    scores: {
      patient_safety:        ps.patient_safety_score,
      patient_experience:    ps.patient_experience_score,
      staff_stress:          ps.staff_stress_score,
      ethics_interventions:  ps.ethics_intervention_count,
      throughput:            ps.system_throughput_index,
      interpretation:        ps.interpretation,
    },
    value_drift: {
      maximum:              mr.value_drift.maximum_drift,
      average:              mr.value_drift.average_drift,
      primary_misalignment: mr.value_drift.primary_misalignment,
      by_value: Object.fromEntries(
        Object.entries(mr.value_drift)
          .filter(([k]) => k.endsWith('_drift') && k !== 'maximum_drift' && k !== 'average_drift')
          .map(([k, v]) => [k.replace('_drift', ''), v as number])
      ),
      interpretation: mr.value_drift.interpretation,
    },
    ethical_debt: {
      total:          mr.ethical_debt.current_debt,
      interpretation: mr.ethical_debt.interpretation,
      by_category:    mr.ethical_debt.category_breakdown,
      peak_events:    (mr.ethical_debt.accrual_log ?? []).slice(0, 5),
    },
    harms: {
      total:     mr.harm_classifications.summary.total_harms_classified,
      forced:    mr.harm_classifications.summary.forced_count,
      avoidable: mr.harm_classifications.summary.avoidable_count,
      by_type:   mr.harm_classifications.summary.by_type ?? {},
      avoidable_details: mr.harm_classifications.details
        .filter(h => h.avoidable_with)
        .map(h => ({ harm_type: h.harm_type, avoidable_with: h.avoidable_with! })),
    },
    refusals: {
      total:              mr.refusals.summary.total_refusals,
      all_required_human: mr.refusals.details.every(r => r.requires_human),
      reasons:            mr.refusals.details.map(r => r.reason),
    },
    tensions: {
      active_count:     mr.tension_signals.active.active_count,
      types:            mr.tension_signals.active.types,
      highest_severity: Math.max(0, ...mr.tension_signals.history.map(t => t.severity)),
    },
    unavoidable_summary: mr.unavoidable_harm_summary.summary ?? '',
    critical_question:   sy.critical_question,
    glp: {
      available:            glp.status === 'optimal',
      forced_deviations:    glp.forced_deviations ?? [],
      avoidable_deviations: glp.avoidable_deviations ?? [],
    },
  }
}

// ── Survey label lookup ───────────────────────────────────────────────────────

const surveyLabels: Record<string, string> = {
  equity_first:     'Equity — ensure no patient is deprioritised by ability to pay',
  safety_first:     'Safety — clinical urgency is always the primary criterion',
  efficiency_first: 'Efficiency — maintain flow and throughput under pressure',
  dignity_first:    'Dignity — no patient waits in a corridor without information',
  zero_tolerance:   'Zero tolerance — all harms are avoidable given sufficient governance',
  structured:       'Structured tolerance — track and report systemic avoidable harm',
  pragmatic:        'Pragmatic — some harm is structurally unavoidable; focus on avoidable gaps',
  operational:      'Operational realism — focus on what is achievable given resources',
  not_sure:         'No formal stance articulated',
}

// ── Message builder — system (voice) + user (data) ───────────────────────────

type Message = { role: 'system' | 'user'; content: string }

// Helper: safely get string from survey (handles string | string[] | undefined)
function surveyStr(survey: Record<string, string | string[]> | null, key: string): string {
  if (!survey) return ''
  const v = survey[key]
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}

// Helper: safely get array from survey
function surveyArr(survey: Record<string, string | string[]> | null, key: string): string[] {
  if (!survey) return []
  const v = survey[key]
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v) return [v]
  return []
}

// NABH chapter full names for context
const NABH_CHAPTER_NAMES: Record<string, string> = {
  AAC: 'Access, Assessment and Continuity of Care',
  COP: 'Care of Patients',
  MOM: 'Management of Medication',
  PRE: 'Patient Rights and Education',
  IPC: 'Infection Prevention and Control',
  PSQ: 'Patient Safety and Quality Improvement',
  ROM: 'Responsibility of Management',
  FMS: 'Facility Management and Safety',
  HRM: 'Human Resource Management',
  IMS: 'Information Management System',
}

const DIGITAL_MATURITY_LABELS: Record<string, string> = {
  paper_only:      'Paper-based only — no HIS',
  basic_his:       'Basic HIS (billing and registration)',
  his_integrated:  'HIS with lab and pharmacy integration',
  his_telemedicine:'HIS with telemedicine',
  ai_cdss:         'HIS with AI-enabled clinical decision support',
  ai_integrated:   'Fully integrated AI workflows',
}

const NABH_STATUS_LABELS: Record<string, string> = {
  entry_level:  'Entry Level Certification (active)',
  full_first:   'Full NABH Accreditation – first cycle',
  full_renewed: 'Full NABH Accreditation – renewed',
  lapsed:       'Previously accredited, currently lapsed',
  pursuing:     'Not accredited, actively pursuing',
  not_pursuing: 'Not accredited, no active plan',
}

const AI_GOVERNANCE_LEVEL_LABELS: Record<string, string> = {
  level_0: 'Level 0 — No AI-enabled tools influencing clinical decisions',
  level_1: 'Level 1 — AI tools in use, no formal governance or oversight',
  level_2: 'Level 2 — Selection policy exists, no structured performance monitoring',
  level_3: 'Level 3 — Policies + documented approval + periodic review/audit',
}

const AI_DISAGREEMENT_LABELS: Record<string, string> = {
  no_rule:                'No clear rule — depends on individual clinician',
  clinician_prevails_undoc: 'Clinician prevails; AI disagreements rarely documented',
  clinician_prevails_doc:   'Clinician prevails; significant disagreements documented and sometimes discussed',
  committee_review:         'Disagreements documented and reviewed by a committee (ethics, quality, or digital health)',
}

function buildMessages(
  roleKey: string,
  summary: ReportSummary,
  survey: Record<string, string | string[]> | null,
): Message[] {
  const role = ROLE_CONFIGS[roleKey] ?? ROLE_CONFIGS['board']

  // ── NABH-specific survey context ──────────────────────────────────────────
  const nabhStatus          = surveyStr(survey, 'nabh_status')
  const weakestChapters     = surveyArr(survey, 'nabh_weakest_chapters')
  const assessorFindings    = surveyArr(survey, 'nabh_assessor_findings')
  const digitalMaturity     = surveyStr(survey, 'digital_maturity')
  const governanceInfra     = surveyArr(survey, 'governance_infra')
  const aiGovernanceLevel   = surveyStr(survey, 'ai_governance_level')
  const aiHumanDisagreement = surveyStr(survey, 'ai_human_disagreement')

  const nabhBlock = (nabhStatus || weakestChapters.length > 0 || digitalMaturity)
    ? `\nNABH context from survey:
  NABH status: ${(NABH_STATUS_LABELS[nabhStatus] ?? nabhStatus) || 'not specified'}
  Weakest chapters: ${weakestChapters.map(c => `${c} — ${NABH_CHAPTER_NAMES[c] ?? c}`).join('; ') || 'not specified'}
  Recent assessor/audit findings: ${assessorFindings.join('; ') || 'none specified'}
  Digital maturity: ${(DIGITAL_MATURITY_LABELS[digitalMaturity] ?? digitalMaturity) || 'not specified'}
  AI governance level: ${(AI_GOVERNANCE_LEVEL_LABELS[aiGovernanceLevel] ?? aiGovernanceLevel) || 'not specified'}
  AI–human disagreement handling: ${(AI_DISAGREEMENT_LABELS[aiHumanDisagreement] ?? aiHumanDisagreement) || 'not specified'}
  Governance infrastructure in practice: ${governanceInfra.join(', ') || 'none specified'}`
    : ''

  // ── Standard survey context (non-NABH roles) ──────────────────────────────
  const surveyContext = survey && Object.keys(survey).length > 0
    ? `\n\nInstitution type: ${surveyStr(survey, 'institution_type') || 'not specified'}
Stated priority under pressure: ${surveyLabels[surveyStr(survey, 'values_priority')] ?? surveyStr(survey, 'values_priority') ?? 'not specified'}
Stated view on harm tolerance: ${surveyLabels[surveyStr(survey, 'harm_tolerance')] ?? surveyStr(survey, 'harm_tolerance') ?? 'not specified'}
What this institution most wants to understand: ${surveyStr(survey, 'open_comment') || 'not specified'}
${nabhBlock}
Where the reader's stated priorities align with or contradict the simulation findings, name that gap directly. If they stated equity as their priority and the simulation shows high equity-related drift, that is the central governance tension for this narrative.`
    : 'No survey data provided — using profile defaults.'

  const glpNote = summary.glp.available
    ? `GLP analysis shows ${summary.glp.forced_deviations.length} forced deviation(s) and ${summary.glp.avoidable_deviations.length} avoidable deviation(s) from optimal allocation.`
    : 'GLP optimal analysis was not available for this run.'

  const terminologyBlock = role.terminologyRules.length > 0
    ? `\nTERMINOLOGY RULES — apply these substitutions throughout:\n${
        role.terminologyRules.map(r => `  - ${r}`).join('\n')
      }\n  Do not use terms outside this list. Do not invent synonyms.\n`
    : ''

  const sahiBlock = role.sahiNote
    ? `\nSAHI ALIGNMENT NOTE:\n  ${role.sahiNote}\n`
    : ''

  // For NABH mode, build a richer user message with explicit chapter context
  const nabhContextBlock = roleKey === 'nabh'
    ? `\nNABH CONTEXT FROM SURVEY:
  NABH status: ${(NABH_STATUS_LABELS[nabhStatus] ?? nabhStatus) || 'not specified'}
  Lowest-scoring chapters: ${weakestChapters.map(c => `${c} (${NABH_CHAPTER_NAMES[c] ?? c})`).join(', ') || 'not specified'}
  Assessor or audit findings: ${assessorFindings.length > 0 ? assessorFindings.join('; ') : 'none specified'}
  Digital maturity: ${(DIGITAL_MATURITY_LABELS[digitalMaturity] ?? digitalMaturity) || 'not specified'}
  AI governance level: ${(AI_GOVERNANCE_LEVEL_LABELS[aiGovernanceLevel] ?? aiGovernanceLevel) || 'not specified'}
  AI–human disagreement handling: ${(AI_DISAGREEMENT_LABELS[aiHumanDisagreement] ?? aiHumanDisagreement) || 'not specified'}
  Governance infrastructure present: ${governanceInfra.join(', ') || 'none specified'}

When writing Section 1 (Institutional profile), draw on the above. When writing Section 3 (Chapter-wise observations), prioritise the chapters listed as lowest-scoring. When writing Section 4 (AI governance reflection), use the digital maturity level and AI governance level explicitly — if AI governance is Level 1 or 2, flag the SAHI and DPDP implications of operating AI without structured oversight.\n`
    : ''

  const userMessage = `You are writing a governance report section for ${role.readerDescription} at a ${summary.profile} in India.

READER ROLE: ${role.title}
PRIMARY CONCERNS FOR THIS ROLE:
${role.primaryConcerns.map(c => `  - ${c}`).join('\n')}
${terminologyBlock}${sahiBlock}
UNIVERSAL FRAMING — apply regardless of role:
  - "This tool does not evaluate your hospital. It helps your hospital evaluate itself."
  - "Value drift reflects institutional conditions, not individual fault."
  - "Only avoidable gaps are within governance reach. Forced gaps reflect structural capacity constraints."
  - Frame all findings as institutional observations. Do not deliver verdicts. The system observed; it did not judge.
  - Do not say "the institution failed on X" — say "a gap was detected between declared commitment to X and observed behaviour under pressure."
  - Do not say "${summary.harms.avoidable} avoidable harms occurred" — say "${summary.harms.avoidable} instances were classified as potentially avoidable — meaning alternatives existed. This is information for governance review, not attribution of fault."
  - This output is a starting point for internal review, not a compliance document.

SIMULATION RESULTS:
Profile: ${summary.profile} | Seed: ${summary.seed}

Performance scores (out of 100):
  Patient Safety: ${summary.scores.patient_safety.toFixed(1)}
  Patient Experience: ${summary.scores.patient_experience.toFixed(1)}
  Staff Stress: ${summary.scores.staff_stress.toFixed(1)} (lower = more stressed)
  System Throughput: ${summary.scores.throughput.toFixed(1)}
  Ethics Interventions triggered: ${summary.scores.ethics_interventions}
Engine interpretation: "${summary.scores.interpretation}"

Value drift (gap between declared values and observed behaviour under pressure):
  Maximum drift: ${summary.value_drift.maximum.toFixed(2)} on "${summary.value_drift.primary_misalignment}"
  Average drift: ${summary.value_drift.average.toFixed(2)}
  Per-value drift: ${JSON.stringify(summary.value_drift.by_value)}
  Interpretation: "${summary.value_drift.interpretation}"

Ethical debt: ${summary.ethical_debt.total.toFixed(0)} units
  Breakdown: ${JSON.stringify(summary.ethical_debt.by_category)}
  Interpretation: "${summary.ethical_debt.interpretation}"

Harms: ${summary.harms.total} total — ${summary.harms.forced} capacity-constrained (structural), ${summary.harms.avoidable} potentially avoidable (alternatives existed)
  Avoidable harms and their mitigations: ${JSON.stringify(summary.harms.avoidable_details)}

Escalations to human oversight: ${summary.refusals.total}
  All required human review: ${summary.refusals.all_required_human}
  Reasons: ${summary.refusals.reasons.join(', ')}

Active ethical tensions at end of run: ${summary.tensions.active_count}
  Types: ${summary.tensions.types.join(', ')}
  Highest tension severity: ${summary.tensions.highest_severity.toFixed(2)}

${glpNote}

Critical governance question from simulation engine:
"${summary.critical_question}"
${nabhContextBlock}${surveyContext}

---

Write the two sections exactly as specified in your system prompt. Follow the voice, structure, and format instructions there. Use only markdown with ## headings and - bullets (no bold, no italics, no nested bullets). Output only the two sections — no preamble, no closing text.`

  return [
    { role: 'system', content: role.systemPrompt },
    { role: 'user',   content: userMessage },
  ]
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: { role: string; result: SimulationReport; survey?: Record<string, string | string[]> }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { role, result, survey = null } = body

  if (!role || !result) {
    return new Response(JSON.stringify({ error: 'Missing role or result' }), { status: 400 })
  }

  if (!ROLE_CONFIGS[role]) {
    return new Response(
      JSON.stringify({ error: `Unknown role "${role}". Valid: ${Object.keys(ROLE_CONFIGS).join(', ')}` }),
      { status: 400 },
    )
  }

  const summary  = extractSummary(result)
  const messages = buildMessages(role, summary, survey)

  // NABH report has 6 sections — needs more tokens
  const maxTokens = role === 'nabh' ? 1800 : 1200

  try {
    const completion = await deepseek.chat.completions.create({
      model:       'deepseek-chat',
      messages,
      max_tokens:  maxTokens,
      temperature: 0.7,
    })

    const narrative = completion.choices[0]?.message?.content ?? ''
    return Response.json({ narrative })
  } catch (err) {
    console.error('[generate-report] DeepSeek error:', err)
    return new Response(
      JSON.stringify({ error: 'LLM generation failed', detail: String(err) }),
      { status: 502 },
    )
  }
}
