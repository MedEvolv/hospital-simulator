/**
 * Governance Drift Engine
 *
 * Tracks divergence between formal governance rules and actual
 * institutional behaviour.
 *
 * Formal rule: "Every AI discharge summary must be reviewed by a clinician."
 * Actual practice under strain: "Clinicians sign summaries after scanning
 * the first paragraph."
 *
 * Drift is not rule-breaking. It is the normalisation of gap.
 */

import type { SimEvent } from '@/lib/types'
import type { GovernanceDriftState } from '@/lib/types/governance'
import { DEFAULT_GOVERNANCE_DRIFT } from '@/lib/types/governance'

// ── Drift impact table ────────────────────────────────────────────────────────

interface DriftImpact {
  policyPracticeGap: number        // delta to policy-practice gap (0–100)
  reviewDecay: number              // delta to review thoroughness decay (0–100)
  escalationAvoidance: number      // delta to escalation avoidance index (0–100)
  workaroundNormalization: number  // delta to workaround normalization score (0–100)
  autonomyShift: number            // delta to effective autonomy level (L0–L6 as float)
  driftSource?: string
}

const DRIFT_IMPACTS: Record<string, DriftImpact> = {
  // v1 events
  ESCALATION_SUGGESTED: {
    policyPracticeGap: 1,
    reviewDecay: 0,
    escalationAvoidance: 1,
    workaroundNormalization: 0.5,
    autonomyShift: 0.05,
    driftSource: 'unresolved escalation: governance pathway underused',
  },
  AGENT_ACTION: {
    policyPracticeGap: 0.5,
    reviewDecay: 0.3,
    escalationAvoidance: 0,
    workaroundNormalization: 0.2,
    autonomyShift: 0.02,
    driftSource: 'AI action without documented oversight',
  },

  // v2 events — drift accelerators
  AI_HALLUCINATION_MISSED: {
    policyPracticeGap: 8,
    reviewDecay: 12,
    escalationAvoidance: 3,
    workaroundNormalization: 5,
    autonomyShift: 0.3,
    driftSource: 'hallucination passed review — declared L3 acting as L4/L5',
  },
  ESCALATION_FAILED: {
    policyPracticeGap: 6,
    reviewDecay: 2,
    escalationAvoidance: 10,
    workaroundNormalization: 4,
    autonomyShift: 0.2,
    driftSource: 'escalation failure: human oversight pathway blocked',
  },
  ACCOUNTABILITY_AMBIGUOUS: {
    policyPracticeGap: 7,
    reviewDecay: 4,
    escalationAvoidance: 3,
    workaroundNormalization: 6,
    autonomyShift: 0.15,
    driftSource: 'nobody owns the decision — policy exists, accountability does not',
  },
  OVERLOAD_SURGE: {
    policyPracticeGap: 4,
    reviewDecay: 6,
    escalationAvoidance: 5,
    workaroundNormalization: 8,
    autonomyShift: 0.1,
    driftSource: 'surge conditions force informal workarounds',
  },
  STAFFING_SHORTAGE: {
    policyPracticeGap: 5,
    reviewDecay: 8,
    escalationAvoidance: 4,
    workaroundNormalization: 7,
    autonomyShift: 0.15,
    driftSource: 'staff shortage: policy requires oversight that cannot be staffed',
  },
  ALERT_SUPPRESSION: {
    policyPracticeGap: 6,
    reviewDecay: 5,
    escalationAvoidance: 7,
    workaroundNormalization: 6,
    autonomyShift: 0.1,
    driftSource: 'alert dismissal under load: oversight bypassed informally',
  },

  // Cybersecurity events
  CREDENTIAL_SHARE: {
    policyPracticeGap: 10,
    reviewDecay: 0,
    escalationAvoidance: 2,
    workaroundNormalization: 8,
    autonomyShift: 0,
    driftSource: 'credential sharing: formal identity controls are not followed',
  },
  DATA_ACCESS_BREACH: {
    policyPracticeGap: 12,
    reviewDecay: 3,
    escalationAvoidance: 4,
    workaroundNormalization: 5,
    autonomyShift: 0,
    driftSource: 'data breach: access governance has collapsed',
  },

  // Drift reducers
  GOVERNANCE_INTERVENTION: {
    policyPracticeGap: -6,
    reviewDecay: -4,
    escalationAvoidance: -5,
    workaroundNormalization: -4,
    autonomyShift: -0.15,
    driftSource: undefined,
  },
  HUMAN_OVERRIDE_DOCUMENTED: {
    policyPracticeGap: -3,
    reviewDecay: -5,
    escalationAvoidance: -2,
    workaroundNormalization: -2,
    autonomyShift: -0.1,
    driftSource: undefined,
  },
  ESCALATION_SUCCESS: {
    policyPracticeGap: -4,
    reviewDecay: -2,
    escalationAvoidance: -7,
    workaroundNormalization: -3,
    autonomyShift: -0.1,
    driftSource: undefined,
  },
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function clampAutonomy(level: number): number {
  return Math.max(0, Math.min(6, level))
}

function describeGovernanceDrift(
  impact: DriftImpact,
  state: GovernanceDriftState,
): string {
  if (!impact.driftSource) {
    return 'Governance intervention is reducing the gap between policy and practice.'
  }

  const autonomyMismatch = state.effectiveAutonomyLevel - state.declaredAutonomyLevel
  if (autonomyMismatch >= 1.5) {
    return `Governance drift alert: AI is operating at effective autonomy L${state.effectiveAutonomyLevel.toFixed(1)} while policy declares L${state.declaredAutonomyLevel}. The gap is widening.`
  }

  if (state.policyPracticeGap > 50) {
    return `The gap between formal governance policy and actual practice has grown to ${state.policyPracticeGap.toFixed(0)}% — workarounds are becoming the new normal.`
  }

  return impact.driftSource
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function updateGovernanceDrift(
  current: GovernanceDriftState = DEFAULT_GOVERNANCE_DRIFT,
  event: SimEvent,
): {
  state: GovernanceDriftState
  explanation: string
  delta: number
} {
  const impact = DRIFT_IMPACTS[event.event_type]

  if (!impact) {
    return { state: current, explanation: '', delta: 0 }
  }

  const newGap = clamp(current.policyPracticeGap + impact.policyPracticeGap)
  const newReviewDecay = clamp(current.reviewThoroughnessDecay + impact.reviewDecay)
  const newEscalationAvoidance = clamp(current.escalationAvoidanceIndex + impact.escalationAvoidance)
  const newWorkaround = clamp(current.workaroundNormalizationScore + impact.workaroundNormalization)
  const newEffectiveAutonomy = clampAutonomy(
    current.effectiveAutonomyLevel + impact.autonomyShift,
  )

  const newDriftSources = impact.driftSource
    ? [...new Set([...current.driftSources, impact.driftSource])].slice(-10)
    : current.driftSources

  const nextState: GovernanceDriftState = {
    policyPracticeGap: newGap,
    declaredAutonomyLevel: current.declaredAutonomyLevel,
    effectiveAutonomyLevel: newEffectiveAutonomy,
    reviewThoroughnessDecay: newReviewDecay,
    escalationAvoidanceIndex: newEscalationAvoidance,
    workaroundNormalizationScore: newWorkaround,
    driftSources: newDriftSources,
    lastPolicyCheckTick: current.lastPolicyCheckTick,
  }

  const overallDelta = impact.policyPracticeGap  // use policy gap as primary signal

  return {
    state: nextState,
    explanation: describeGovernanceDrift(impact, nextState),
    delta: overallDelta,
  }
}

/** Check whether declared vs effective autonomy mismatch has crossed a threshold */
export function getAutonomyMismatch(state: GovernanceDriftState): {
  mismatch: number
  isSignificant: boolean
  label: string
} {
  const mismatch = state.effectiveAutonomyLevel - state.declaredAutonomyLevel
  const isSignificant = mismatch >= 1.0

  let label = 'Aligned'
  if (mismatch >= 2.0) label = 'Critical mismatch'
  else if (mismatch >= 1.0) label = 'Significant drift'
  else if (mismatch >= 0.5) label = 'Slight drift'

  return { mismatch: Math.round(mismatch * 10) / 10, isSignificant, label }
}

export { DEFAULT_GOVERNANCE_DRIFT }
