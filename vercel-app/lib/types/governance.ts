/**
 * Governance engine state types — v2 architecture.
 *
 * Each engine accepts (current state + event + context) and returns
 * (updated state + explanation string + delta).
 *
 * Design law: every state change must be attributable to an event,
 * human action, AI action, governance intervention, or time-based accumulation.
 * No silent mutation.
 */

// ── Operational Trust Engine ──────────────────────────────────────────────────

export interface OperationalTrustState {
  overall: number                    // 0–100 (100 = full trust)
  patientTrust: number
  staffTrust: number
  governanceTrust: number
  aiTrustBySystem: Record<string, number>
  trustCalibration: number           // accuracy of trust vs actual reliability
  trustFragmentation: number         // divergence across trust sub-scores
  recoveryPotential: number          // how quickly trust can be restored
  lastChangedAt: number              // tick
  lastChangeReason: string
}

export const DEFAULT_OPERATIONAL_TRUST: OperationalTrustState = {
  overall: 75,
  patientTrust: 75,
  staffTrust: 75,
  governanceTrust: 70,
  aiTrustBySystem: {},
  trustCalibration: 80,
  trustFragmentation: 0,
  recoveryPotential: 60,
  lastChangedAt: 0,
  lastChangeReason: 'baseline',
}

// ── Hidden Strain Engine ──────────────────────────────────────────────────────

export type HiddenStrainType =
  | 'staff_strain'
  | 'patient_strain'
  | 'queue_strain'
  | 'documentation_strain'
  | 'escalation_strain'
  | 'governance_strain'
  | 'review_strain'
  | 'trust_strain'
  | 'fairness_strain'

export interface HiddenStrainState {
  overall: number                    // 0–100
  byType: Record<HiddenStrainType, number>
  accumulationRate: number           // units per tick
  delayedConsequenceRisk: number     // probability of imminent visible failure
  strainTimeline: StrainTimelineEntry[]
  tippingPointRisk: number           // 0–100
}

export interface StrainTimelineEntry {
  tick: number
  strainType: HiddenStrainType
  delta: number
  cause: string
}

export const DEFAULT_HIDDEN_STRAIN: HiddenStrainState = {
  overall: 10,
  byType: {
    staff_strain: 10,
    patient_strain: 10,
    queue_strain: 10,
    documentation_strain: 5,
    escalation_strain: 10,
    governance_strain: 10,
    review_strain: 10,
    trust_strain: 10,
    fairness_strain: 10,
  },
  accumulationRate: 0,
  delayedConsequenceRisk: 5,
  strainTimeline: [],
  tippingPointRisk: 5,
}

// ── Ethical Debt Engine ───────────────────────────────────────────────────────

export type EthicalDebtSourceType =
  | 'queue_displacement'              // vulnerable groups repeatedly delayed
  | 'unreviewed_ai_content'           // AI output used without human review
  | 'ignored_frontline_concerns'      // escalations suppressed
  | 'systematic_language_disadvantage'
  | 'throughput_over_care'            // explicit tradeoff made
  | 'escalation_suppression'
  | 'accountability_ambiguity'        // near-miss with no clear owner
  | 'data_privacy_violation'          // cybersecurity failure

export interface EthicalDebtSource {
  type: EthicalDebtSourceType
  tick: number
  amount: number
  description: string
  affectedGroup?: string
}

export interface EthicalDebtState {
  totalDebt: number
  sources: EthicalDebtSource[]
  affectedGroups: string[]
  accumulationRate: number
  visibility: number                  // how visible the debt is to stakeholders (0–100)
  unresolvedEvents: string[]          // event IDs with no resolution
  tippingPointRisk: number
}

export const DEFAULT_ETHICAL_DEBT: EthicalDebtState = {
  totalDebt: 0,
  sources: [],
  affectedGroups: [],
  accumulationRate: 0,
  visibility: 50,
  unresolvedEvents: [],
  tippingPointRisk: 0,
}

// ── Governance Drift Engine ───────────────────────────────────────────────────

export interface GovernanceDriftState {
  policyPracticeGap: number          // 0–100 (100 = formal policy, actual anarchy)
  declaredAutonomyLevel: number      // L0–L6 as declared
  effectiveAutonomyLevel: number     // L0–L6 as observed
  reviewThoroughnessDecay: number    // 0–100 (100 = rubber-stamping)
  escalationAvoidanceIndex: number
  workaroundNormalizationScore: number
  driftSources: string[]
  lastPolicyCheckTick: number
}

export const DEFAULT_GOVERNANCE_DRIFT: GovernanceDriftState = {
  policyPracticeGap: 5,
  declaredAutonomyLevel: 2,
  effectiveAutonomyLevel: 2,
  reviewThoroughnessDecay: 0,
  escalationAvoidanceIndex: 0,
  workaroundNormalizationScore: 0,
  driftSources: [],
  lastPolicyCheckTick: 0,
}

// ── Automation Drift Engine ───────────────────────────────────────────────────

export interface AutomationDriftState {
  aiSystemId: string
  acceptanceRate: number             // fraction of AI suggestions accepted (0–1)
  overrideRate: number               // fraction overridden by human (0–1)
  averageReviewTimeSeconds: number
  reviewQuality: number              // 0–100 (decreases with fatigue + repetition)
  effectiveAutonomyLevel: number     // L0–L6 as observed
  declaredAutonomyLevel: number      // L0–L6 as declared in policy
  driftVelocity: number              // rate of increase in effective autonomy
  rubberstampingRisk: number         // 0–100
}

// ── Accountability Trace Engine ───────────────────────────────────────────────

export interface AccountabilityState {
  events: AccountabilityRecord[]
  responsibilityAmbiguityScore: number  // 0–100 (100 = no one owns anything)
  manyHandsRiskIndicator: number
  undocumentedDecisions: number
}

export interface AccountabilityRecord {
  eventId: string
  tick: number
  aiRole: string | null
  humanRole: string | null
  institutionalRole: string | null
  policyRequirement: string | null
  actualAction: string
  escalationPath: string | null
  auditStatus: 'documented' | 'partial' | 'missing'
  reversibility: 'none' | 'partial' | 'full'
  clarityScore: number               // 0–100 (100 = crystal clear who did what)
}

// ── Governance Check ──────────────────────────────────────────────────────────
// Returned by each engine with every state update.

export interface GovernanceCheck {
  passed: boolean
  violations: string[]
  recommendations: string[]
  affectedGates: string[]            // which of the 7 hard gates is affected
}

// ── Consequence ───────────────────────────────────────────────────────────────

export interface Consequence {
  type: 'trust_impact' | 'ethical_debt' | 'strain_increase' | 'governance_drift' | 'automation_drift'
  magnitude: number
  description: string
  reversible: boolean
}
