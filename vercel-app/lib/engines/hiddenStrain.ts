/**
 * Hidden Strain Engine
 *
 * Tracks operational degradation NOT visible through standard metrics.
 * Delayed emergence is critical — strain accumulates gradually and may
 * not manifest immediately.
 *
 * Examples of hidden strain:
 * - Staff appear compliant but review quality decays
 * - Queue metrics improve but chronic patients are displaced
 * - Alerts are acknowledged but not cognitively processed
 * - Governance meetings occur but no meaningful action follows
 */

import type { SimEvent } from '@/lib/types'
import type { HiddenStrainState, HiddenStrainType, StrainTimelineEntry } from '@/lib/types/governance'
import { DEFAULT_HIDDEN_STRAIN } from '@/lib/types/governance'

// ── Strain impact table ───────────────────────────────────────────────────────
// Each event type maps to which strain categories it affects and by how much

interface StrainImpact {
  type: HiddenStrainType
  delta: number
}

const STRAIN_IMPACTS: Record<string, StrainImpact[]> = {
  // Patient flow events (v1)
  PATIENT_ARRIVAL: [
    { type: 'queue_strain', delta: 0.5 },
  ],
  QUEUE_REORDER: [
    { type: 'queue_strain', delta: 1.0 },
    { type: 'fairness_strain', delta: 0.8 },
  ],
  ESCALATION_SUGGESTED: [
    { type: 'escalation_strain', delta: 2.0 },
    { type: 'governance_strain', delta: 1.0 },
  ],
  AGENT_ACTION: [
    { type: 'review_strain', delta: 0.5 },  // each AI action = review burden
  ],

  // Governance events (v2)
  ESCALATION_FAILED: [
    { type: 'escalation_strain', delta: 8.0 },
    { type: 'staff_strain', delta: 5.0 },
    { type: 'trust_strain', delta: 4.0 },
  ],
  AI_HALLUCINATION_MISSED: [
    { type: 'review_strain', delta: 10.0 },
    { type: 'trust_strain', delta: 6.0 },
    { type: 'governance_strain', delta: 5.0 },
  ],
  QUEUE_DISPLACEMENT: [
    { type: 'fairness_strain', delta: 8.0 },
    { type: 'patient_strain', delta: 6.0 },
  ],
  ACCOUNTABILITY_AMBIGUOUS: [
    { type: 'governance_strain', delta: 7.0 },
    { type: 'staff_strain', delta: 4.0 },
  ],
  ALERT_FLOOD: [
    { type: 'staff_strain', delta: 10.0 },
    { type: 'review_strain', delta: 8.0 },
  ],
  STAFFING_SHORTAGE: [
    { type: 'staff_strain', delta: 12.0 },
    { type: 'queue_strain', delta: 6.0 },
    { type: 'escalation_strain', delta: 5.0 },
  ],
  OVERLOAD_SURGE: [
    { type: 'queue_strain', delta: 10.0 },
    { type: 'staff_strain', delta: 8.0 },
    { type: 'patient_strain', delta: 6.0 },
  ],

  // Cybersecurity events
  PHISHING_ATTEMPT: [
    { type: 'staff_strain', delta: 6.0 },
    { type: 'governance_strain', delta: 4.0 },
  ],
  CREDENTIAL_SHARE: [
    { type: 'governance_strain', delta: 8.0 },
    { type: 'staff_strain', delta: 3.0 },
  ],
  ALERT_SUPPRESSION: [
    { type: 'governance_strain', delta: 6.0 },
    { type: 'review_strain', delta: 5.0 },
  ],
  DATA_ACCESS_BREACH: [
    { type: 'governance_strain', delta: 15.0 },
    { type: 'trust_strain', delta: 10.0 },
    { type: 'staff_strain', delta: 8.0 },
  ],
  RANSOMWARE_TRIGGER: [
    { type: 'governance_strain', delta: 25.0 },
    { type: 'documentation_strain', delta: 20.0 },
    { type: 'trust_strain', delta: 15.0 },
  ],

  // Restorations
  GOVERNANCE_INTERVENTION: [
    { type: 'governance_strain', delta: -5.0 },
    { type: 'trust_strain', delta: -3.0 },
  ],
  ESCALATION_SUCCESS: [
    { type: 'escalation_strain', delta: -6.0 },
    { type: 'staff_strain', delta: -2.0 },
  ],
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function computeOverall(byType: Record<HiddenStrainType, number>): number {
  const values = Object.values(byType)
  // Weighted average — escalation + governance strain weighted higher
  // because they represent institutional failure, not just operational load
  const weighted =
    byType.escalation_strain * 1.3 +
    byType.governance_strain * 1.3 +
    byType.trust_strain * 1.2 +
    byType.fairness_strain * 1.1 +
    byType.staff_strain * 1.0 +
    byType.review_strain * 1.0 +
    byType.queue_strain * 0.9 +
    byType.patient_strain * 0.9 +
    byType.documentation_strain * 0.8

  const totalWeight = 1.3 + 1.3 + 1.2 + 1.1 + 1.0 + 1.0 + 0.9 + 0.9 + 0.8
  return clamp(weighted / totalWeight)
}

function computeTippingPointRisk(byType: Record<HiddenStrainType, number>): number {
  // Risk spikes when multiple strain types are high simultaneously
  const highCount = Object.values(byType).filter(v => v > 60).length
  const critCount = Object.values(byType).filter(v => v > 80).length
  return clamp(highCount * 8 + critCount * 15)
}

function describeStrain(impacts: StrainImpact[], eventType: string): string {
  if (impacts.length === 0) return ''

  const dominant = impacts.reduce((a, b) => Math.abs(a.delta) > Math.abs(b.delta) ? a : b)
  const isRestoring = dominant.delta < 0

  const strainLabels: Record<HiddenStrainType, string> = {
    staff_strain: 'staff are under pressure that may not show up in standard metrics',
    patient_strain: 'patient frustration and anxiety are quietly building',
    queue_strain: 'the queue is accumulating invisible backpressure',
    documentation_strain: 'documentation quality is slipping under the load',
    escalation_strain: 'escalation pathways are becoming blocked or avoided',
    governance_strain: 'governance processes are under strain that formal checks won\'t catch',
    review_strain: 'review quality is decaying — decisions are being rubber-stamped',
    trust_strain: 'institutional trust is eroding beneath the surface',
    fairness_strain: 'equity is being quietly compromised in the queue',
  }

  if (isRestoring) {
    return `Hidden strain in ${dominant.type.replace('_', ' ')} is easing — the system is recovering.`
  }

  return strainLabels[dominant.type] ?? `Hidden ${dominant.type.replace('_', ' ')} is accumulating after a ${eventType.toLowerCase().replace(/_/g, ' ')} event.`
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function updateHiddenStrain(
  current: HiddenStrainState = DEFAULT_HIDDEN_STRAIN,
  event: SimEvent,
): {
  state: HiddenStrainState
  explanation: string
  delta: number
} {
  const impacts = STRAIN_IMPACTS[event.event_type]

  if (!impacts || impacts.length === 0) {
    return { state: current, explanation: '', delta: 0 }
  }

  const nextByType = { ...current.byType }
  let totalDelta = 0
  const newEntries: StrainTimelineEntry[] = []

  for (const impact of impacts) {
    nextByType[impact.type] = clamp(nextByType[impact.type] + impact.delta)
    totalDelta += impact.delta
    newEntries.push({
      tick: event.timestamp,
      strainType: impact.type,
      delta: impact.delta,
      cause: event.event_type,
    })
  }

  const newOverall = computeOverall(nextByType)
  const prevOverall = current.overall
  const overallDelta = newOverall - prevOverall

  // Accumulation rate: rolling average of recent delta
  const newRate = current.accumulationRate * 0.8 + overallDelta * 0.2

  // Timeline: keep last 50 entries
  const newTimeline = [...current.strainTimeline, ...newEntries].slice(-50)

  const nextState: HiddenStrainState = {
    overall: newOverall,
    byType: nextByType,
    accumulationRate: Math.round(newRate * 100) / 100,
    delayedConsequenceRisk: clamp(newOverall * 0.6 + current.tippingPointRisk * 0.4),
    strainTimeline: newTimeline,
    tippingPointRisk: computeTippingPointRisk(nextByType),
  }

  return {
    state: nextState,
    explanation: describeStrain(impacts, event.event_type),
    delta: Math.round(overallDelta * 10) / 10,
  }
}

/** Passive strain accumulation: small base rate of strain even without events */
export function applyPassiveStrainAccumulation(
  current: HiddenStrainState,
  tickDelta: number = 1,
): HiddenStrainState {
  // All strain types drift upward at 0.02/tick unless actively resolved
  const PASSIVE_RATE = 0.02 * tickDelta
  const nextByType = { ...current.byType }

  for (const key of Object.keys(nextByType) as HiddenStrainType[]) {
    nextByType[key] = Math.min(100, nextByType[key] + PASSIVE_RATE)
  }

  return {
    ...current,
    byType: nextByType,
    overall: computeOverall(nextByType),
  }
}

export { DEFAULT_HIDDEN_STRAIN }
