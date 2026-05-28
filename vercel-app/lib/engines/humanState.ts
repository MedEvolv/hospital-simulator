/**
 * Human-State Engine
 *
 * Models the aggregate psychological and cognitive state of clinical staff
 * as an operationally consequential variable — not a welfare metric.
 *
 * Human state directly affects:
 * - Whether escalations are raised (escalationWillingness)
 * - Whether AI outputs are actually reviewed (reviewCapacity)
 * - Whether AI recommendations are challenged (overrideConfidence)
 * - Whether governance policies are followed under pressure (perceivedBlameRisk)
 *
 * Design law: this engine models the staff pool, not individuals.
 * All values represent the aggregate drift across a department shift.
 *
 * Positive delta = staff state degraded (more stress, less capacity).
 * Negative delta = staff state improved.
 */

import type { SimEvent } from '@/lib/types'
import type { StaffVariables, HumanStateRiskFlag, HumanRole } from '@/lib/types/humanState'

// ── Aggregate staff state ─────────────────────────────────────────────────────

/**
 * Aggregate staff state for a department.
 * All values represent population averages across the shift.
 */
export interface AggregateStaffState extends StaffVariables {
  tick: number
  dominantRole?: HumanRole       // most affected role in current shift
}

export const DEFAULT_AGGREGATE_STAFF_STATE: AggregateStaffState = {
  fatigue: 30,
  cognitiveLoad: 30,
  burnout: 15,
  moralDistress: 10,
  alertFatigue: 15,
  trustInAI: 65,
  trustInInstitution: 70,
  escalationWillingness: 75,
  reviewCapacity: 80,
  overrideConfidence: 70,
  perceivedBlameRisk: 20,
  tick: 0,
}

// ── Impact table ──────────────────────────────────────────────────────────────
// Positive delta = variable increases. Each field uses its own scale (0–100).

interface StaffImpact {
  fatigue?: number
  cognitiveLoad?: number
  burnout?: number
  moralDistress?: number
  alertFatigue?: number
  trustInAI?: number
  trustInInstitution?: number
  escalationWillingness?: number
  reviewCapacity?: number
  overrideConfidence?: number
  perceivedBlameRisk?: number
  description: string
}

const STAFF_IMPACTS: Record<string, StaffImpact> = {
  // Stress and load events
  OVERLOAD_SURGE: {
    fatigue: 8,
    cognitiveLoad: 10,
    burnout: 3,
    moralDistress: 2,
    reviewCapacity: -10,
    escalationWillingness: -5,
    description:
      'Surge has increased cognitive load — review thoroughness and escalation likelihood are both falling.',
  },
  STAFFING_SHORTAGE: {
    fatigue: 12,
    cognitiveLoad: 8,
    burnout: 5,
    moralDistress: 4,
    reviewCapacity: -12,
    escalationWillingness: -6,
    description:
      'Staff shortage is compressing review time — fatigue is accumulating and review capacity is dropping.',
  },
  ALERT_FLOOD: {
    alertFatigue: 12,
    cognitiveLoad: 8,
    burnout: 2,
    reviewCapacity: -8,
    description:
      'Alert overload is training staff to dismiss notifications — alert fatigue is now a patient safety variable.',
  },
  ALERT_SUPPRESSION: {
    alertFatigue: 5,
    cognitiveLoad: 3,
    moralDistress: 3,
    perceivedBlameRisk: 4,
    description:
      'Staff are suppressing alerts under load — cognitive numbing and blame anxiety are building.',
  },

  // Governance failures
  AI_HALLUCINATION_MISSED: {
    moralDistress: 10,
    trustInAI: -12,
    perceivedBlameRisk: 8,
    overrideConfidence: -6,
    description:
      'A missed AI error has damaged staff confidence in AI outputs and raised fear of being blamed.',
  },
  ESCALATION_FAILED: {
    moralDistress: 12,
    trustInInstitution: -10,
    escalationWillingness: -10,
    burnout: 4,
    description:
      'An escalation went unresolved — staff have learned that raising concerns may not change outcomes.',
  },
  ACCOUNTABILITY_AMBIGUOUS: {
    moralDistress: 8,
    perceivedBlameRisk: 10,
    trustInInstitution: -6,
    overrideConfidence: -5,
    description:
      'Unclear accountability raises fear of blame — staff become less willing to challenge decisions.',
  },
  QUEUE_DISPLACEMENT: {
    moralDistress: 6,
    burnout: 2,
    trustInInstitution: -4,
    description:
      'A patient was displaced in the queue — frontline staff can see the fairness compromise even if metrics cannot.',
  },

  // Cybersecurity events
  RANSOMWARE_TRIGGER: {
    cognitiveLoad: 15,
    moralDistress: 10,
    fatigue: 8,
    burnout: 5,
    trustInInstitution: -12,
    description:
      'A ransomware event has created systemic panic — staff cognitive load and institutional trust have both collapsed.',
  },
  DATA_ACCESS_BREACH: {
    moralDistress: 8,
    trustInInstitution: -8,
    perceivedBlameRisk: 6,
    description:
      'A data breach creates moral distress and raises blame anxiety — who had access, and who should have checked?',
  },
  CREDENTIAL_SHARE: {
    perceivedBlameRisk: 6,
    moralDistress: 3,
    trustInInstitution: -3,
    description:
      'Credential sharing erodes accountability — staff know security was compromised, and worry about consequences.',
  },
  PHISHING_ATTEMPT: {
    cognitiveLoad: 6,
    alertFatigue: 5,
    moralDistress: 3,
    description:
      'A phishing attempt during a high-pressure shift adds cognitive load at the worst possible moment.',
  },

  // Positive events — partial restorations
  GOVERNANCE_INTERVENTION: {
    moralDistress: -5,
    trustInInstitution: 6,
    escalationWillingness: 4,
    burnout: -2,
    description:
      'A governance intervention has signalled that leadership is responsive — morale and escalation willingness recover.',
  },
  ESCALATION_SUCCESS: {
    moralDistress: -6,
    trustInInstitution: 8,
    escalationWillingness: 8,
    overrideConfidence: 4,
    description:
      'A successful escalation has reinforced that raising concerns works — escalation willingness climbs.',
  },
  HUMAN_OVERRIDE_DOCUMENTED: {
    overrideConfidence: 6,
    perceivedBlameRisk: -4,
    trustInAI: -2,  // slight recalibration: AI was wrong enough to be overridden
    description:
      'A documented override reinforces that clinicians can and should challenge AI outputs.',
  },
  PATIENT_ADMITTED: {
    moralDistress: -1,
    burnout: -1,
    description:
      'A successful admission is a small reminder that the system can deliver — cumulative small wins matter.',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function applyImpact(
  state: AggregateStaffState,
  impact: StaffImpact,
  eventTick: number,
): AggregateStaffState {
  return {
    fatigue:                clamp(state.fatigue + (impact.fatigue ?? 0)),
    cognitiveLoad:          clamp(state.cognitiveLoad + (impact.cognitiveLoad ?? 0)),
    burnout:                clamp(state.burnout + (impact.burnout ?? 0)),
    moralDistress:          clamp(state.moralDistress + (impact.moralDistress ?? 0)),
    alertFatigue:           clamp(state.alertFatigue + (impact.alertFatigue ?? 0)),
    trustInAI:              clamp(state.trustInAI + (impact.trustInAI ?? 0)),
    trustInInstitution:     clamp(state.trustInInstitution + (impact.trustInInstitution ?? 0)),
    escalationWillingness:  clamp(state.escalationWillingness + (impact.escalationWillingness ?? 0)),
    reviewCapacity:         clamp(state.reviewCapacity + (impact.reviewCapacity ?? 0)),
    overrideConfidence:     clamp(state.overrideConfidence + (impact.overrideConfidence ?? 0)),
    perceivedBlameRisk:     clamp(state.perceivedBlameRisk + (impact.perceivedBlameRisk ?? 0)),
    tick: eventTick,
    dominantRole: state.dominantRole,
  }
}

/**
 * Compute a scalar stress index from the aggregate staff state.
 * Used as the primary delta signal.
 * Higher = more stressed, less capable.
 */
function computeStressIndex(state: AggregateStaffState): number {
  return (
    state.fatigue * 0.20 +
    state.cognitiveLoad * 0.20 +
    state.burnout * 0.15 +
    state.moralDistress * 0.20 +
    state.alertFatigue * 0.10 +
    (100 - state.reviewCapacity) * 0.10 +
    (100 - state.escalationWillingness) * 0.05
  )
}

function assessRiskFlags(state: AggregateStaffState): HumanStateRiskFlag[] {
  const flags: HumanStateRiskFlag[] = []

  if (state.reviewCapacity < 40) {
    flags.push({
      type: 'review_failure_risk',
      severity: state.reviewCapacity < 20 ? 'critical' : 'high',
      affectedRole: 'junior_doctor',
      recommendation:
        'Review capacity is critically low. Consider requiring mandatory second-check for high-risk AI outputs.',
    })
  }

  if (state.escalationWillingness < 40) {
    flags.push({
      type: 'escalation_failure_risk',
      severity: state.escalationWillingness < 25 ? 'critical' : 'high',
      affectedRole: 'nurse',
      recommendation:
        'Staff are unlikely to escalate concerns. A recent escalation success or governance signal is needed.',
    })
  }

  if (state.trustInAI > 85 && state.overrideConfidence < 40) {
    flags.push({
      type: 'automation_reliance_risk',
      severity: 'high',
      affectedRole: 'junior_doctor',
      recommendation:
        'High AI trust combined with low override confidence indicates automation complacency. Introduce AI error drills.',
    })
  }

  if (state.burnout > 70) {
    flags.push({
      type: 'burnout_imminent',
      severity: state.burnout > 85 ? 'critical' : 'high',
      affectedRole: 'nurse',
      recommendation:
        'Burnout is approaching critical threshold. Staff workload redistribution or surge protocol activation is needed.',
    })
  }

  if (state.perceivedBlameRisk > 70) {
    flags.push({
      type: 'escalation_failure_risk',
      severity: 'medium',
      affectedRole: 'resident',
      recommendation:
        'High perceived blame risk suppresses override and escalation. Accountability frameworks need clarifying.',
    })
  }

  return flags
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function updateHumanState(
  current: AggregateStaffState = DEFAULT_AGGREGATE_STAFF_STATE,
  event: SimEvent,
): {
  state: AggregateStaffState
  explanation: string
  delta: number
  riskFlags: HumanStateRiskFlag[]
} {
  const impact = STAFF_IMPACTS[event.event_type]

  if (!impact) {
    return {
      state: current,
      explanation: '',
      delta: 0,
      riskFlags: [],
    }
  }

  const prevStress = computeStressIndex(current)
  const nextState = applyImpact(current, impact, event.timestamp)
  const nextStress = computeStressIndex(nextState)

  const delta = Math.round((nextStress - prevStress) * 10) / 10

  return {
    state: nextState,
    explanation: impact.description,
    delta,
    riskFlags: assessRiskFlags(nextState),
  }
}

/**
 * Passive recovery: on quiet ticks, fatigue and cognitive load recover slowly
 * toward baseline. Burnout and moral distress recover much more slowly.
 * Review capacity and escalation willingness recover at a moderate rate.
 */
export function applyPassiveHumanRecovery(
  current: AggregateStaffState,
  tickDelta: number = 1,
): AggregateStaffState {
  const FAST_RECOVERY = 0.1 * tickDelta      // fatigue, cognitive load
  const SLOW_RECOVERY = 0.02 * tickDelta     // burnout, moral distress
  const MEDIUM_RECOVERY = 0.05 * tickDelta   // review capacity, escalation willingness

  const FATIGUE_TARGET = 30
  const COGNITIVE_TARGET = 30
  const REVIEW_TARGET = 80
  const ESCALATION_TARGET = 75

  function driftToward(current: number, target: number, rate: number): number {
    if (Math.abs(current - target) < 1) return current
    return current + (current < target ? rate : -rate)
  }

  return {
    ...current,
    fatigue:               clamp(driftToward(current.fatigue, FATIGUE_TARGET, FAST_RECOVERY)),
    cognitiveLoad:         clamp(driftToward(current.cognitiveLoad, COGNITIVE_TARGET, FAST_RECOVERY)),
    burnout:               clamp(current.burnout - SLOW_RECOVERY),
    moralDistress:         clamp(current.moralDistress - SLOW_RECOVERY),
    alertFatigue:          clamp(current.alertFatigue - MEDIUM_RECOVERY),
    reviewCapacity:        clamp(driftToward(current.reviewCapacity, REVIEW_TARGET, MEDIUM_RECOVERY)),
    escalationWillingness: clamp(driftToward(current.escalationWillingness, ESCALATION_TARGET, MEDIUM_RECOVERY)),
  }
}

/**
 * Derive the HumanStateAggregate snapshot fields from aggregate staff state.
 * Used when writing to SimulationStateSnapshot.humanState.
 */
export function toHumanStateAggregate(state: AggregateStaffState) {
  return {
    averageFatigue: Math.round(state.fatigue),
    averageCognitiveLoad: Math.round(state.cognitiveLoad),
    alertFatigue: Math.round(state.alertFatigue),
    moraleScore: Math.round(100 - state.burnout),       // inverse burnout
    escalationWillingness: Math.round(state.escalationWillingness),
    reviewCapacity: Math.round(state.reviewCapacity),
  }
}

export { DEFAULT_AGGREGATE_STAFF_STATE as DEFAULT_HUMAN_STATE }
