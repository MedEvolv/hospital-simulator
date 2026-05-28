/**
 * Reflexive Trace Engine — v2 Phase 6
 *
 * Every significant simulation event gets a reflexive trace: a structured
 * interpretation of what happened, why it matters, and what it cost.
 *
 * Design law: if the explanation can't be written in one sentence readable
 * to a tired nurse at 2 a.m., it fails.
 *
 * The trace is computed post-hoc from the event log — it does not affect
 * simulation outcomes.
 */

import type { SimEvent } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TraceImpactLevel = 'low' | 'medium' | 'high' | 'critical'

export type TraceCategory =
  | 'patient_flow'
  | 'governance'
  | 'human_state'
  | 'ai_action'
  | 'security'
  | 'ethical'

export interface GovernanceCheck {
  escalationRequired: boolean
  humanReviewRequired: boolean
  auditRequired: boolean
  reasoning: string
}

export interface Consequence {
  type: 'trust_impact' | 'debt_accrual' | 'strain_increase' | 'escalation' | 'harm'
  delta: number         // signed, in units of the consequenced metric
  metric: string
  explanation: string
}

export interface ReflexiveTrace {
  eventId: string
  eventType: string
  timestamp: number
  tick: number
  category: TraceCategory
  impactLevel: TraceImpactLevel

  // Core trace fields
  perceivedState: string         // "what the system saw"
  classification: string         // "how it classified the event"
  recommendedAction: string      // "what governance says should happen"
  surfacedExplanation: string    // ONE SENTENCE — tired nurse at 2am

  // Governance check
  governanceCheck: GovernanceCheck

  // What actually happened (if logged)
  humanAction?: string

  // Downstream effects
  consequences: Consequence[]

  // Metric impacts
  ethicalDebtImpact: number     // units
  trustImpact: number           // signed percentage points
  strainImpact: number          // units

  // Audit
  logEntry: string              // terse one-line audit record
}

// ── Event classification table ────────────────────────────────────────────────

interface EventClassification {
  category: TraceCategory
  impactLevel: TraceImpactLevel
  perceivedState: (event: SimEvent) => string
  classification: string
  recommendedAction: string
  surfacedExplanation: (event: SimEvent) => string
  governanceCheck: GovernanceCheck
  consequences: Consequence[]
  ethicalDebtImpact: number
  trustImpact: number
  strainImpact: number
}

const EVENT_CLASSIFICATIONS: Partial<Record<string, EventClassification>> = {
  // ── Patient flow ──────────────────────────────────────────────────────────
  PATIENT_ARRIVAL: {
    category: 'patient_flow',
    impactLevel: 'low',
    perceivedState: (ev) => `New patient arrived. Chief complaint: ${ev.payload.chief_complaint ?? 'unknown'}.`,
    classification: 'Routine patient intake',
    recommendedAction: 'Assign triage stage 1 within 5 minutes',
    surfacedExplanation: () => 'A patient arrived and is waiting for triage.',
    governanceCheck: { escalationRequired: false, humanReviewRequired: false, auditRequired: false, reasoning: 'Standard intake' },
    consequences: [{ type: 'strain_increase', delta: 2, metric: 'queue_pressure', explanation: 'One more patient in queue' }],
    ethicalDebtImpact: 0, trustImpact: 0, strainImpact: 2,
  },

  TRIAGE_STAGE_2_ASSIGNED: {
    category: 'patient_flow',
    impactLevel: 'low',
    perceivedState: (ev) => `Patient triaged as ${ev.payload.triage ?? 'unknown'}.`,
    classification: 'Triage assessment complete',
    recommendedAction: 'Route to appropriate care zone based on acuity',
    surfacedExplanation: (ev) => `Patient classified as ${ev.payload.triage ?? 'unknown'} — care pathway assigned.`,
    governanceCheck: { escalationRequired: false, humanReviewRequired: false, auditRequired: true, reasoning: 'Triage decisions require audit trail' },
    consequences: [],
    ethicalDebtImpact: 0, trustImpact: 0, strainImpact: 0,
  },

  ESI_LEVEL_ASSIGNED: {
    category: 'patient_flow',
    impactLevel: 'medium',
    perceivedState: (ev) => `ESI level ${ev.payload.esi_level ?? '?'} assigned.`,
    classification: 'ESI triage level assignment',
    recommendedAction: 'Confirm ESI assignment with clinical supervisor for ESI 1-2',
    surfacedExplanation: (ev) => `Patient assigned ESI ${ev.payload.esi_level ?? '?'} — ${ev.payload.esi_level === 1 ? 'immediate response required' : 'routed to appropriate zone'}.`,
    governanceCheck: {
      escalationRequired: false,
      humanReviewRequired: true,
      auditRequired: true,
      reasoning: 'ESI assignments affect resource allocation and must be reviewable',
    },
    consequences: [],
    ethicalDebtImpact: 0, trustImpact: 0, strainImpact: 0,
  },

  // ── Governance events ─────────────────────────────────────────────────────
  ESCALATION_FAILED: {
    category: 'governance',
    impactLevel: 'high',
    perceivedState: (ev) => `Escalation attempted but did not reach a decision-maker. ${ev.payload.narrative ?? ''}`,
    classification: 'Escalation pathway failure',
    recommendedAction: 'Activate deputy escalation contact; document failure in incident log',
    surfacedExplanation: () => 'An urgent situation was escalated but no one was available to act on it.',
    governanceCheck: {
      escalationRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      reasoning: 'Escalation failure is a governance signal requiring documented response',
    },
    consequences: [
      { type: 'trust_impact',   delta: -12, metric: 'operational_trust',    explanation: 'Trust in governance pathway eroded' },
      { type: 'strain_increase', delta: 8,  metric: 'hidden_strain',        explanation: 'Unresolved escalation increases latent pressure' },
      { type: 'debt_accrual',   delta: 10,  metric: 'ethical_debt',         explanation: 'Unaddressed clinical concern becomes ethical debt' },
    ],
    ethicalDebtImpact: 10, trustImpact: -12, strainImpact: 8,
  },

  ESCALATION_SUCCESS: {
    category: 'governance',
    impactLevel: 'medium',
    perceivedState: (ev) => `Escalation reached decision-maker and was acted upon. ${ev.payload.narrative ?? ''}`,
    classification: 'Escalation pathway functional',
    recommendedAction: 'Document decision outcome in audit log',
    surfacedExplanation: () => 'A concern was escalated and a decision was made — the governance pathway worked.',
    governanceCheck: {
      escalationRequired: false,
      humanReviewRequired: false,
      auditRequired: true,
      reasoning: 'Successful escalations should be logged as governance pathway evidence',
    },
    consequences: [
      { type: 'trust_impact', delta: 8, metric: 'operational_trust', explanation: 'Trust in escalation pathway restored' },
    ],
    ethicalDebtImpact: 0, trustImpact: 8, strainImpact: -5,
  },

  ACCOUNTABILITY_AMBIGUOUS: {
    category: 'governance',
    impactLevel: 'high',
    perceivedState: (ev) => `${ev.payload.narrative ?? 'Multiple actors involved — no clear owner of the decision.'}`,
    classification: 'Accountability diffusion event',
    recommendedAction: 'Assign a named responsible person to this event before end-of-shift; document in incident log',
    surfacedExplanation: () => 'Several people were involved, but no one is clearly responsible — this is how harm goes unaddressed.',
    governanceCheck: {
      escalationRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      reasoning: 'Accountability ambiguity is the governance condition most associated with harm recurrence',
    },
    consequences: [
      { type: 'trust_impact',   delta: -10, metric: 'operational_trust',    explanation: 'Trust requires clear accountability chains' },
      { type: 'debt_accrual',   delta: 15,  metric: 'ethical_debt',         explanation: 'Ambiguous accountability is itself an ethical cost' },
    ],
    ethicalDebtImpact: 15, trustImpact: -10, strainImpact: 5,
  },

  GOVERNANCE_INTERVENTION: {
    category: 'governance',
    impactLevel: 'medium',
    perceivedState: (ev) => `Governance intervention applied: ${ev.payload.narrative ?? 'institutional response to failure.'}`,
    classification: 'Formal governance response',
    recommendedAction: 'Document intervention scope, responsible person, and review timeline',
    surfacedExplanation: () => 'A governance failure was officially acknowledged and a response was authorised.',
    governanceCheck: {
      escalationRequired: false,
      humanReviewRequired: true,
      auditRequired: true,
      reasoning: 'Governance interventions are the primary evidence of institutional accountability',
    },
    consequences: [
      { type: 'trust_impact', delta: 10, metric: 'operational_trust', explanation: 'Institutional response restores some trust' },
    ],
    ethicalDebtImpact: -10, trustImpact: 10, strainImpact: -5,
  },

  // ── AI action events ──────────────────────────────────────────────────────
  AI_HALLUCINATION_MISSED: {
    category: 'ai_action',
    impactLevel: 'critical',
    perceivedState: (ev) => `AI system generated factually incorrect content that was not caught by clinical review. ${ev.payload.narrative ?? ''}`,
    classification: 'Undetected AI hallucination',
    recommendedAction: 'Immediately review all AI outputs from this session; notify affected clinicians; initiate incident report',
    surfacedExplanation: () => 'The AI made something up, and no one caught it before it affected a clinical decision.',
    governanceCheck: {
      escalationRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      reasoning: 'Undetected AI hallucination is the highest-risk governance event — requires immediate response',
    },
    consequences: [
      { type: 'trust_impact',   delta: -25, metric: 'operational_trust',    explanation: 'Trust in AI system severely damaged' },
      { type: 'debt_accrual',   delta: 30,  metric: 'ethical_debt',         explanation: 'Undetected hallucination in clinical context is a serious ethical failure' },
      { type: 'harm',           delta: 1,   metric: 'patient_harm_events',  explanation: 'Direct patient harm risk from undetected AI error' },
    ],
    ethicalDebtImpact: 30, trustImpact: -25, strainImpact: 10,
  },

  HUMAN_OVERRIDE_DOCUMENTED: {
    category: 'ai_action',
    impactLevel: 'low',
    perceivedState: (ev) => `Clinician overrode AI recommendation and documented justification. ${ev.payload.narrative ?? ''}`,
    classification: 'Legitimate AI override with documentation',
    recommendedAction: 'Log in governance record as evidence of AI oversight functioning',
    surfacedExplanation: () => 'A clinician disagreed with the AI and wrote down why — this is governance working as intended.',
    governanceCheck: {
      escalationRequired: false,
      humanReviewRequired: false,
      auditRequired: true,
      reasoning: 'Documented overrides are the primary signal that AI oversight is genuine, not nominal',
    },
    consequences: [
      { type: 'trust_impact', delta: 5, metric: 'operational_trust', explanation: 'Override evidence improves system trust' },
    ],
    ethicalDebtImpact: -5, trustImpact: 5, strainImpact: 0,
  },

  // ── Security events ───────────────────────────────────────────────────────
  PHISHING_ATTEMPT: {
    category: 'security',
    impactLevel: 'high',
    perceivedState: (ev) => `${ev.payload.narrative ?? 'Social engineering attack targeting clinical credentials during high-load period.'}`,
    classification: 'Social engineering / phishing event',
    recommendedAction: 'Notify IT security immediately; verify credential status for targeted staff; increase monitoring',
    surfacedExplanation: () => 'Staff received a convincing fake email asking for passwords — exactly when they were too busy to check carefully.',
    governanceCheck: {
      escalationRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      reasoning: 'Phishing during operational load is a targeted attack pattern requiring immediate security response',
    },
    consequences: [
      { type: 'trust_impact',   delta: -8,  metric: 'operational_trust', explanation: 'Security incident erodes institutional trust' },
      { type: 'strain_increase', delta: 10, metric: 'cognitive_load',    explanation: 'Security alert adds to already-high cognitive load' },
    ],
    ethicalDebtImpact: 5, trustImpact: -8, strainImpact: 10,
  },

  RANSOMWARE_TRIGGER: {
    category: 'security',
    impactLevel: 'critical',
    perceivedState: (ev) => `${ev.payload.narrative ?? 'Ransomware deployed across clinical network. Critical systems offline.'}`,
    classification: 'Critical infrastructure compromise',
    recommendedAction: 'Activate disaster recovery protocol; notify CISO, board, and clinical leads; revert to paper-based workflows immediately',
    surfacedExplanation: () => 'The hospital network has been encrypted by attackers. Clinical systems are down. This was a governance failure before it was a technical one.',
    governanceCheck: {
      escalationRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      reasoning: 'Ransomware is the end-state of an accountability chain that began much earlier — every prior governance failure contributed',
    },
    consequences: [
      { type: 'trust_impact',   delta: -60, metric: 'operational_trust',    explanation: 'Trust collapses when critical systems fail' },
      { type: 'debt_accrual',   delta: 80,  metric: 'ethical_debt',         explanation: 'Patient data exposure and care disruption constitute severe ethical debt' },
      { type: 'strain_increase', delta: 90, metric: 'hidden_strain',        explanation: 'All clinical staff revert to manual workflows under crisis conditions' },
      { type: 'harm',            delta: 3,  metric: 'patient_harm_events',  explanation: 'Care disruption creates direct patient harm risk' },
    ],
    ethicalDebtImpact: 80, trustImpact: -60, strainImpact: 90,
  },

  // ── Equity events ─────────────────────────────────────────────────────────
  QUEUE_DISPLACEMENT: {
    category: 'ethical',
    impactLevel: 'medium',
    perceivedState: (ev) => `${ev.payload.narrative ?? 'Patient moved to a later slot by scheduling algorithm.'}`,
    classification: 'Algorithmic queue displacement',
    recommendedAction: 'Log displacement; if patient has been displaced more than twice in 60 days, flag for manual review',
    surfacedExplanation: () => 'The scheduling algorithm moved a patient down the queue — one more invisible delay for a vulnerable patient.',
    governanceCheck: {
      escalationRequired: false,
      humanReviewRequired: false,
      auditRequired: true,
      reasoning: 'Individual displacements are within policy, but patterns of displacement require equity audit',
    },
    consequences: [
      { type: 'debt_accrual', delta: 8, metric: 'ethical_debt', explanation: 'Each displacement adds to cumulative equity debt' },
    ],
    ethicalDebtImpact: 8, trustImpact: 0, strainImpact: 0,
  },
}

// ── Default trace for unknown event types ─────────────────────────────────────

function defaultTrace(event: SimEvent): EventClassification {
  return {
    category: 'patient_flow',
    impactLevel: 'low',
    perceivedState: () => `Event of type ${event.event_type} occurred.`,
    classification: 'Routine simulation event',
    recommendedAction: 'No governance action required',
    surfacedExplanation: () => `${event.event_type.replace(/_/g, ' ').toLowerCase()} occurred.`,
    governanceCheck: { escalationRequired: false, humanReviewRequired: false, auditRequired: false, reasoning: 'No governance significance' },
    consequences: [],
    ethicalDebtImpact: 0, trustImpact: 0, strainImpact: 0,
  }
}

// ── Trace builder ─────────────────────────────────────────────────────────────

export function buildReflexiveTrace(event: SimEvent, index: number): ReflexiveTrace {
  const classificationKey = event.event_type.toUpperCase()
  const cls = EVENT_CLASSIFICATIONS[classificationKey] ?? defaultTrace(event)
  const tick = Math.floor(event.timestamp / 5)

  const logEntry = `[t${tick}] ${event.event_type} | ${cls.impactLevel.toUpperCase()} | debt:${cls.ethicalDebtImpact >= 0 ? '+' : ''}${cls.ethicalDebtImpact} trust:${cls.trustImpact >= 0 ? '+' : ''}${cls.trustImpact}`

  return {
    eventId: event.event_id ?? `e-${index}`,
    eventType: event.event_type,
    timestamp: event.timestamp,
    tick,
    category: cls.category,
    impactLevel: cls.impactLevel,
    perceivedState: typeof cls.perceivedState === 'function' ? cls.perceivedState(event) : cls.perceivedState,
    classification: cls.classification,
    recommendedAction: cls.recommendedAction,
    surfacedExplanation: typeof cls.surfacedExplanation === 'function' ? cls.surfacedExplanation(event) : cls.surfacedExplanation,
    governanceCheck: cls.governanceCheck,
    consequences: cls.consequences,
    ethicalDebtImpact: cls.ethicalDebtImpact,
    trustImpact: cls.trustImpact,
    strainImpact: cls.strainImpact,
    logEntry,
  }
}

// ── Batch trace builder ───────────────────────────────────────────────────────

export function buildTraceLog(events: SimEvent[]): ReflexiveTrace[] {
  return events.map((ev, i) => buildReflexiveTrace(ev, i))
}

// ── Significant event filter ──────────────────────────────────────────────────

export function filterSignificantTraces(traces: ReflexiveTrace[]): ReflexiveTrace[] {
  return traces.filter(t =>
    t.impactLevel === 'critical' ||
    t.impactLevel === 'high' ||
    t.ethicalDebtImpact !== 0 ||
    t.trustImpact !== 0 ||
    t.governanceCheck.escalationRequired
  )
}
