/**
 * Automation Drift Engine
 *
 * Tracks the gap between declared AI autonomy level and actual operating
 * behaviour. Drift occurs silently — no policy is violated, but effective
 * autonomy creeps upward as humans review less carefully.
 *
 * Key signal: an AI system declared as L2 (Suggests) but whose outputs are
 * accepted in 94% of cases without documented scrutiny is effectively
 * operating as L4 (Acts Reversibly). The policy says L2. The institution
 * is running L4.
 *
 * This engine is per-AI-system. The runner calls it once per system per event.
 */

import type { SimEvent } from '@/lib/types'
import type { AutomationDriftState } from '@/lib/types/governance'

// ── Drift impact table ────────────────────────────────────────────────────────

interface DriftImpact {
  acceptanceDelta: number         // shift in acceptance rate (±0.0–1.0)
  reviewQualityDelta: number      // delta to review quality score (0–100)
  effectiveAutonomyShift: number  // direct shift in effective L level (L0–L6)
  rubberstampingSignal: number    // delta to rubberstamping risk (0–100)
  description?: string            // undefined = restoration event
}

const DRIFT_IMPACTS: Record<string, DriftImpact> = {
  // Drift accelerators
  AI_HALLUCINATION_MISSED: {
    acceptanceDelta: 0.05,
    reviewQualityDelta: -12,
    effectiveAutonomyShift: 0.4,
    rubberstampingSignal: 15,
    description:
      'A hallucination passed undetected — the review was nominal, not substantive.',
  },
  AGENT_ACTION: {
    acceptanceDelta: 0.01,
    reviewQualityDelta: -1,
    effectiveAutonomyShift: 0.03,
    rubberstampingSignal: 1,
    description:
      'An undocumented AI action incrementally shifts effective autonomy upward.',
  },
  ALERT_FLOOD: {
    acceptanceDelta: 0.04,
    reviewQualityDelta: -8,
    effectiveAutonomyShift: 0.15,
    rubberstampingSignal: 10,
    description:
      'Alert overload is forcing clinicians to accept AI outputs without substantive review.',
  },
  ALERT_SUPPRESSION: {
    acceptanceDelta: 0.02,
    reviewQualityDelta: -6,
    effectiveAutonomyShift: 0.1,
    rubberstampingSignal: 8,
    description:
      'Alert suppression under load: oversight pathways are being bypassed to maintain pace.',
  },
  OVERLOAD_SURGE: {
    acceptanceDelta: 0.04,
    reviewQualityDelta: -7,
    effectiveAutonomyShift: 0.2,
    rubberstampingSignal: 8,
    description:
      'Surge conditions: staff accept AI outputs faster to maintain throughput.',
  },
  STAFFING_SHORTAGE: {
    acceptanceDelta: 0.03,
    reviewQualityDelta: -5,
    effectiveAutonomyShift: 0.15,
    rubberstampingSignal: 7,
    description:
      'Staffing shortage: fewer reviewers means more AI decisions pass without scrutiny.',
  },
  ESCALATION_FAILED: {
    acceptanceDelta: 0.02,
    reviewQualityDelta: -3,
    effectiveAutonomyShift: 0.1,
    rubberstampingSignal: 5,
    description:
      'Escalation failure signals that human oversight is not reliable — AI fills the gap.',
  },
  ACCOUNTABILITY_AMBIGUOUS: {
    acceptanceDelta: 0.01,
    reviewQualityDelta: -4,
    effectiveAutonomyShift: 0.08,
    rubberstampingSignal: 6,
    description:
      'Unclear accountability reduces review motivation — nobody knows who is responsible.',
  },

  // Drift reducers
  HUMAN_OVERRIDE_DOCUMENTED: {
    acceptanceDelta: -0.05,
    reviewQualityDelta: 8,
    effectiveAutonomyShift: -0.2,
    rubberstampingSignal: -12,
  },
  GOVERNANCE_INTERVENTION: {
    acceptanceDelta: -0.03,
    reviewQualityDelta: 6,
    effectiveAutonomyShift: -0.2,
    rubberstampingSignal: -10,
  },
  ESCALATION_SUCCESS: {
    acceptanceDelta: -0.01,
    reviewQualityDelta: 3,
    effectiveAutonomyShift: -0.05,
    rubberstampingSignal: -5,
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function clampRate(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function clampAutonomy(level: number): number {
  return Math.max(0, Math.min(6, level))
}

/**
 * Rubberstamping risk: high when review quality is poor AND acceptance is high.
 * Formula produces 0 at (quality=100, acceptance=0.5) and ~100 at (quality=0, acceptance=1.0).
 */
function computeRubberstampingRisk(
  reviewQuality: number,
  acceptanceRate: number,
): number {
  const qualityFactor = (100 - reviewQuality) * 0.6      // 60% weight to poor quality
  const acceptanceFactor = Math.max(0, (acceptanceRate - 0.4)) * 100   // 40% weight above 40% acceptance
  return clamp(qualityFactor + acceptanceFactor * 0.4)
}

function describeAutomationDrift(
  impact: DriftImpact,
  state: AutomationDriftState,
): string {
  if (!impact.description) {
    return `Human oversight improved: effective autonomy is moving back toward declared L${state.declaredAutonomyLevel}.`
  }

  const autonomyMismatch = state.effectiveAutonomyLevel - state.declaredAutonomyLevel
  if (autonomyMismatch >= 1.5) {
    return (
      `Automation drift alert: ${state.aiSystemId} is operating at effective L${state.effectiveAutonomyLevel.toFixed(1)} ` +
      `but policy declares L${state.declaredAutonomyLevel}. Review is not providing meaningful oversight.`
    )
  }

  if (state.rubberstampingRisk > 70) {
    return `Rubberstamping risk at ${state.rubberstampingRisk.toFixed(0)}%: reviews are happening in name only — the AI is effectively unsupervised.`
  }

  return impact.description
}

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Create a default automation drift state for a given AI system.
 * declaredLevel defaults to L2 (AI Suggests).
 */
export function createDefaultAutomationDrift(
  aiSystemId: string,
  declaredAutonomyLevel: number = 2,
): AutomationDriftState {
  return {
    aiSystemId,
    acceptanceRate: 0.70,
    overrideRate: 0.25,
    averageReviewTimeSeconds: 45,
    reviewQuality: 70,
    effectiveAutonomyLevel: declaredAutonomyLevel,
    declaredAutonomyLevel,
    driftVelocity: 0,
    rubberstampingRisk: 20,
  }
}

export function updateAutomationDrift(
  current: AutomationDriftState,
  event: SimEvent,
): {
  state: AutomationDriftState
  explanation: string
  delta: number
} {
  const impact = DRIFT_IMPACTS[event.event_type]

  if (!impact) {
    return { state: current, explanation: '', delta: 0 }
  }

  // Apply deltas
  const newAcceptanceRate = clampRate(current.acceptanceRate + impact.acceptanceDelta)
  const newOverrideRate = clampRate(
    current.overrideRate - impact.acceptanceDelta * 0.8, // override moves inversely to acceptance
  )
  const newReviewQuality = clamp(current.reviewQuality + impact.reviewQualityDelta)
  const newEffectiveAutonomy = clampAutonomy(
    current.effectiveAutonomyLevel + impact.effectiveAutonomyShift,
  )

  // Drift velocity: exponential moving average of recent autonomy shifts
  const newDriftVelocity =
    current.driftVelocity * 0.85 + impact.effectiveAutonomyShift * 0.15

  // Rubberstamping risk is derived from quality + acceptance
  const newRubberstampingRisk = computeRubberstampingRisk(
    newReviewQuality,
    newAcceptanceRate,
  )

  const nextState: AutomationDriftState = {
    aiSystemId: current.aiSystemId,
    acceptanceRate: Math.round(newAcceptanceRate * 1000) / 1000,
    overrideRate: Math.round(newOverrideRate * 1000) / 1000,
    averageReviewTimeSeconds: current.averageReviewTimeSeconds,   // updated by dedicated review-time events
    reviewQuality: newReviewQuality,
    effectiveAutonomyLevel: Math.round(newEffectiveAutonomy * 100) / 100,
    declaredAutonomyLevel: current.declaredAutonomyLevel,
    driftVelocity: Math.round(newDriftVelocity * 1000) / 1000,
    rubberstampingRisk: Math.round(newRubberstampingRisk),
  }

  return {
    state: nextState,
    explanation: describeAutomationDrift(impact, nextState),
    delta: impact.effectiveAutonomyShift,  // primary signal: autonomy level change
  }
}

/**
 * Get the declared vs effective autonomy mismatch for a system.
 * Mirrors the governance drift equivalent for cross-engine consistency.
 */
export function getAutonomyMismatch(state: AutomationDriftState): {
  mismatch: number
  isSignificant: boolean
  label: string
  systemId: string
} {
  const mismatch = state.effectiveAutonomyLevel - state.declaredAutonomyLevel
  const isSignificant = mismatch >= 1.0

  let label = 'Aligned'
  if (mismatch >= 2.0) label = 'Critical drift'
  else if (mismatch >= 1.5) label = 'Severe drift'
  else if (mismatch >= 1.0) label = 'Significant drift'
  else if (mismatch >= 0.5) label = 'Slight drift'
  else if (mismatch < -0.5) label = 'Over-supervised'

  return {
    mismatch: Math.round(mismatch * 10) / 10,
    isSignificant,
    label,
    systemId: state.aiSystemId,
  }
}

/**
 * Apply passive drift: without corrective events, acceptance rates slowly
 * creep upward and review quality slowly decays. This models the baseline
 * effect of familiarity and workload normalisation.
 */
export function applyPassiveAutomationDrift(
  current: AutomationDriftState,
  tickDelta: number = 1,
): AutomationDriftState {
  const PASSIVE_ACCEPTANCE_CREEP = 0.0005 * tickDelta
  const PASSIVE_QUALITY_DECAY = 0.01 * tickDelta

  const newAcceptanceRate = clampRate(current.acceptanceRate + PASSIVE_ACCEPTANCE_CREEP)
  const newReviewQuality = clamp(current.reviewQuality - PASSIVE_QUALITY_DECAY)
  const newEffectiveAutonomy = clampAutonomy(
    current.effectiveAutonomyLevel + PASSIVE_ACCEPTANCE_CREEP * 0.5,
  )

  return {
    ...current,
    acceptanceRate: Math.round(newAcceptanceRate * 1000) / 1000,
    reviewQuality: newReviewQuality,
    effectiveAutonomyLevel: Math.round(newEffectiveAutonomy * 100) / 100,
    rubberstampingRisk: computeRubberstampingRisk(newReviewQuality, newAcceptanceRate),
  }
}
