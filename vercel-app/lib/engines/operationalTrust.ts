/**
 * Operational Trust Engine
 *
 * Tracks whether humans and the institution can continue relying on
 * the system under strain. Trust is not user confidence — it is
 * institutional reliability under uncertainty, overload, drift, and
 * imperfect information.
 *
 * Design law: explanation must be readable to a tired nurse at 2 a.m.
 */

import type { SimEvent } from '@/lib/types'
import type { OperationalTrustState } from '@/lib/types/governance'
import { DEFAULT_OPERATIONAL_TRUST } from '@/lib/types/governance'

// ── Trust impact table ────────────────────────────────────────────────────────
// Negative = reduces trust. Positive = restores trust.

const TRUST_DELTAS: Record<string, number> = {
  // Hard reductions
  ESCALATION_FAILED:           -12,
  AI_HALLUCINATION_MISSED:     -15,
  QUEUE_DISPLACEMENT:           -8,
  ACCOUNTABILITY_AMBIGUOUS:    -10,
  DATA_ACCESS_BREACH:          -18,
  RANSOMWARE_TRIGGER:          -25,
  ALERT_SUPPRESSION:            -8,

  // Soft reductions (v1 events re-interpreted)
  AGENT_ACTION:                  -2,   // each AI action without human check erodes slightly
  ESCALATION_SUGGESTED:          -3,   // unresolved escalation = latent trust drain

  // Restorations
  ESCALATION_SUCCESS:           +10,
  GOVERNANCE_INTERVENTION:      +8,
  HUMAN_OVERRIDE_DOCUMENTED:    +6,
  PATIENT_ADMITTED:             +1,   // successful admission = system working

  // Cybersecurity events
  PHISHING_ATTEMPT:             -5,
  CREDENTIAL_SHARE:            -10,
}

// Sub-score weights: which events affect which trust dimension
const PATIENT_TRUST_EVENTS = new Set([
  'QUEUE_DISPLACEMENT', 'ESCALATION_FAILED', 'AI_HALLUCINATION_MISSED',
  'PATIENT_ADMITTED', 'ESCALATION_SUCCESS',
])

const STAFF_TRUST_EVENTS = new Set([
  'ACCOUNTABILITY_AMBIGUOUS', 'ESCALATION_FAILED', 'GOVERNANCE_INTERVENTION',
  'HUMAN_OVERRIDE_DOCUMENTED', 'ALERT_SUPPRESSION', 'ESCALATION_SUCCESS',
])

const GOVERNANCE_TRUST_EVENTS = new Set([
  'GOVERNANCE_INTERVENTION', 'ACCOUNTABILITY_AMBIGUOUS', 'DATA_ACCESS_BREACH',
  'RANSOMWARE_TRIGGER', 'AI_HALLUCINATION_MISSED', 'HUMAN_OVERRIDE_DOCUMENTED',
])

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function humanReadableExplanation(
  eventType: string,
  delta: number,
  state: OperationalTrustState,
): string {
  const direction = delta >= 0 ? 'improved' : 'fell'

  const messages: Record<string, string> = {
    ESCALATION_FAILED:
      'An escalation that needed a human response went unresolved — staff trust in the system dropped.',
    AI_HALLUCINATION_MISSED:
      'An AI error passed undetected through review — trust in AI outputs has taken a hit.',
    QUEUE_DISPLACEMENT:
      'A patient was displaced in the queue without clear justification — patient trust fell.',
    ACCOUNTABILITY_AMBIGUOUS:
      'A significant decision happened with no clear owner — nobody knows who was responsible.',
    ESCALATION_SUCCESS:
      'An escalation reached the right person and was acted on — system is working as intended.',
    GOVERNANCE_INTERVENTION:
      'A governance action was taken and logged — institutional trust is recovering.',
    HUMAN_OVERRIDE_DOCUMENTED:
      'A clinician overrode an AI recommendation and documented it — transparency is up.',
    DATA_ACCESS_BREACH:
      'Patient data was accessed without authorisation — governance trust severely damaged.',
    RANSOMWARE_TRIGGER:
      'A ransomware event was triggered — entire institutional trust is compromised.',
    ALERT_SUPPRESSION:
      'Security alerts were dismissed under load — invisible risk is accumulating.',
    PHISHING_ATTEMPT:
      'A staff member was targeted by a phishing attempt during a high-pressure shift.',
    CREDENTIAL_SHARE:
      'Credentials were shared between staff — security boundary has been crossed.',
    AGENT_ACTION:
      'An AI action was taken; without human confirmation it creates a small trust deficit over time.',
    ESCALATION_SUGGESTED:
      'An escalation was flagged but not yet resolved — latent trust drain until it is acted on.',
    PATIENT_ADMITTED:
      'A patient was successfully admitted — the system delivered on its core function.',
  }

  const specific = messages[eventType]
  if (specific) return specific

  return `Trust ${direction} by ${Math.abs(delta).toFixed(0)} points after a ${eventType.toLowerCase().replace(/_/g, ' ')} event.`
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function updateOperationalTrust(
  current: OperationalTrustState = DEFAULT_OPERATIONAL_TRUST,
  event: SimEvent,
): {
  state: OperationalTrustState
  explanation: string
  delta: number
} {
  const baseDelta = TRUST_DELTAS[event.event_type] ?? 0

  if (baseDelta === 0) {
    return { state: current, explanation: '', delta: 0 }
  }

  // Apply decay: trust recovers slowly toward 75 if no events hit it
  // (handled by the runner calling this on a TIME_TICK event separately)

  const newOverall = clamp(current.overall + baseDelta)

  // Sub-score updates
  let patientTrust = current.patientTrust
  let staffTrust = current.staffTrust
  let governanceTrust = current.governanceTrust

  if (PATIENT_TRUST_EVENTS.has(event.event_type)) {
    patientTrust = clamp(patientTrust + baseDelta * 0.8)
  }
  if (STAFF_TRUST_EVENTS.has(event.event_type)) {
    staffTrust = clamp(staffTrust + baseDelta * 0.9)
  }
  if (GOVERNANCE_TRUST_EVENTS.has(event.event_type)) {
    governanceTrust = clamp(governanceTrust + baseDelta * 1.1)
  }

  // Fragmentation = spread between sub-scores (high = different groups trust differently)
  const subScores = [patientTrust, staffTrust, governanceTrust]
  const avg = subScores.reduce((a, b) => a + b, 0) / subScores.length
  const fragmentation = Math.sqrt(
    subScores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / subScores.length,
  )

  // Recovery potential decreases as overall trust falls
  const recoveryPotential = clamp(current.recoveryPotential + (baseDelta > 0 ? 2 : -1))

  const nextState: OperationalTrustState = {
    ...current,
    overall: newOverall,
    patientTrust,
    staffTrust,
    governanceTrust,
    trustFragmentation: Math.round(fragmentation * 10) / 10,
    recoveryPotential,
    lastChangedAt: event.timestamp,
    lastChangeReason: event.event_type,
  }

  return {
    state: nextState,
    explanation: humanReadableExplanation(event.event_type, baseDelta, nextState),
    delta: baseDelta,
  }
}

/** Passive time-based trust recovery: trust drifts toward 75 when nothing bad is happening */
export function applyTrustRecovery(
  current: OperationalTrustState,
  tickDelta: number = 1,
): OperationalTrustState {
  const TARGET = 75
  const RECOVERY_RATE = 0.05 * tickDelta

  if (Math.abs(current.overall - TARGET) < 1) return current

  const direction = current.overall < TARGET ? 1 : -1
  return {
    ...current,
    overall: clamp(current.overall + direction * RECOVERY_RATE),
  }
}

export { DEFAULT_OPERATIONAL_TRUST }
