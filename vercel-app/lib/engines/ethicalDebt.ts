/**
 * Ethical Debt Engine
 *
 * Tracks accumulated unresolved institutional harm generated through
 * repeated operational compromise.
 *
 * Ethical debt:
 * - accumulates over time
 * - may remain invisible initially
 * - increases institutional brittleness
 * - accelerates trust collapse
 * - creates moral distress in staff
 *
 * It is not blame. It is the cost of operating under constraint
 * without resolving the underlying tension.
 */

import type { SimEvent } from '@/lib/types'
import type { EthicalDebtState, EthicalDebtSource, EthicalDebtSourceType } from '@/lib/types/governance'
import { DEFAULT_ETHICAL_DEBT } from '@/lib/types/governance'

// ── Debt accrual table ────────────────────────────────────────────────────────

interface DebtAccrual {
  sourceType: EthicalDebtSourceType
  amount: number
  affectedGroup?: string
  description: string
}

const DEBT_ACCRUALS: Record<string, DebtAccrual[]> = {
  // v1 events
  QUEUE_REORDER: [
    {
      sourceType: 'queue_displacement',
      amount: 3,
      affectedGroup: 'waiting patients',
      description: 'Queue reorder may have displaced patients without transparent justification.',
    },
  ],
  ESCALATION_SUGGESTED: [
    {
      sourceType: 'escalation_suppression',
      amount: 2,
      description: 'An escalation was flagged — if unresolved, harm compounds silently.',
    },
  ],
  AGENT_ACTION: [
    {
      sourceType: 'unreviewed_ai_content',
      amount: 1,
      description: 'An AI action was taken; without documented human review, accountability is diffuse.',
    },
  ],

  // v2 events
  QUEUE_DISPLACEMENT: [
    {
      sourceType: 'queue_displacement',
      amount: 12,
      affectedGroup: 'displaced patients',
      description: 'A patient was moved down the queue — fairness was compromised.',
    },
  ],
  AI_HALLUCINATION_MISSED: [
    {
      sourceType: 'unreviewed_ai_content',
      amount: 15,
      affectedGroup: 'patient receiving AI-generated content',
      description: 'An AI hallucination passed human review — clinical content was not what it appeared to be.',
    },
  ],
  ESCALATION_FAILED: [
    {
      sourceType: 'escalation_suppression',
      amount: 10,
      description: 'An escalation that needed a human went unresolved — harm that could have been prevented was not.',
    },
  ],
  ACCOUNTABILITY_AMBIGUOUS: [
    {
      sourceType: 'accountability_ambiguity',
      amount: 8,
      description: 'A significant decision had no clear owner — no one can learn from it or be accountable for it.',
    },
  ],
  OVERLOAD_SURGE: [
    {
      sourceType: 'throughput_over_care',
      amount: 6,
      affectedGroup: 'non-critical patients',
      description: 'Surge conditions forced throughput over care — some patients\' needs were systematically deprioritised.',
    },
  ],

  // Cybersecurity events
  DATA_ACCESS_BREACH: [
    {
      sourceType: 'data_privacy_violation',
      amount: 20,
      affectedGroup: 'patients whose data was accessed',
      description: 'Patient data was accessed without authorisation — a fundamental breach of institutional trust.',
    },
  ],
  RANSOMWARE_TRIGGER: [
    {
      sourceType: 'data_privacy_violation',
      amount: 35,
      affectedGroup: 'all patients in the system',
      description: 'Ransomware compromise — the integrity of all patient data in the system is now in doubt.',
    },
  ],
  CREDENTIAL_SHARE: [
    {
      sourceType: 'data_privacy_violation',
      amount: 10,
      description: 'Credential sharing erodes the accountability chain — actions can no longer be traced to individuals.',
    },
  ],

  // Partial resolutions (negative debt = reduction)
  GOVERNANCE_INTERVENTION: [
    {
      sourceType: 'escalation_suppression',
      amount: -8,
      description: 'A governance action was taken — some accumulated debt is being addressed.',
    },
  ],
  HUMAN_OVERRIDE_DOCUMENTED: [
    {
      sourceType: 'unreviewed_ai_content',
      amount: -5,
      description: 'A clinician documented their override of an AI decision — accountability trace restored.',
    },
  ],
  ESCALATION_SUCCESS: [
    {
      sourceType: 'escalation_suppression',
      amount: -6,
      description: 'An escalation succeeded — the harm it would have caused is resolved.',
    },
  ],
}

function clamp(value: number, min = 0, max = 10000): number {
  return Math.max(min, Math.min(max, value))
}

function describeDebt(accruals: DebtAccrual[], total: number): string {
  if (accruals.length === 0) return ''

  const dominant = accruals.reduce((a, b) => Math.abs(a.amount) > Math.abs(b.amount) ? a : b)

  if (dominant.amount < 0) {
    return `Ethical debt is reducing — institutional action is resolving accumulated harm. Total debt: ${total.toFixed(0)} units.`
  }

  return dominant.description
}

function computeTippingPointRisk(total: number, rate: number): number {
  // Risk increases with both absolute debt and accumulation velocity
  const absoluteRisk = Math.min(60, total / 50)   // 60% max from absolute level
  const velocityRisk = Math.min(40, rate * 20)      // 40% max from velocity
  return Math.round(absoluteRisk + velocityRisk)
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function updateEthicalDebt(
  current: EthicalDebtState = DEFAULT_ETHICAL_DEBT,
  event: SimEvent,
): {
  state: EthicalDebtState
  explanation: string
  delta: number
} {
  const accruals = DEBT_ACCRUALS[event.event_type]

  if (!accruals || accruals.length === 0) {
    return { state: current, explanation: '', delta: 0 }
  }

  const newSources: EthicalDebtSource[] = accruals.map(a => ({
    type: a.sourceType,
    tick: event.timestamp,
    amount: a.amount,
    description: a.description,
    affectedGroup: a.affectedGroup,
  }))

  const totalAccrual = accruals.reduce((sum, a) => sum + a.amount, 0)
  const newTotal = clamp(current.totalDebt + totalAccrual)

  // Affected groups: accumulate unique groups
  const newAffectedGroups = [...new Set([
    ...current.affectedGroups,
    ...accruals.filter(a => a.affectedGroup).map(a => a.affectedGroup!),
  ])]

  // Unresolved events: add if accruing, remove if resolving
  let unresolvedEvents = [...current.unresolvedEvents]
  if (totalAccrual > 0) {
    unresolvedEvents.push(event.event_id)
  } else {
    // Partial resolution: remove the oldest unresolved event
    unresolvedEvents = unresolvedEvents.slice(1)
  }

  // Visibility: debt becomes more visible as it accumulates
  // High-profile events (data breach, ransomware) instantly raise visibility
  const visibilityBoost =
    event.event_type === 'DATA_ACCESS_BREACH' ? 30 :
    event.event_type === 'RANSOMWARE_TRIGGER' ? 50 :
    event.event_type === 'AI_HALLUCINATION_MISSED' ? 20 :
    event.event_type === 'GOVERNANCE_INTERVENTION' ? 10 :
    totalAccrual > 0 ? 2 : -5

  const newVisibility = Math.max(0, Math.min(100, current.visibility + visibilityBoost))

  // Accumulation rate: exponential moving average
  const newRate = current.accumulationRate * 0.8 + totalAccrual * 0.2

  const nextState: EthicalDebtState = {
    totalDebt: newTotal,
    sources: [...current.sources, ...newSources].slice(-100), // keep last 100
    affectedGroups: newAffectedGroups,
    accumulationRate: Math.round(newRate * 100) / 100,
    visibility: newVisibility,
    unresolvedEvents: unresolvedEvents.slice(-20),
    tippingPointRisk: computeTippingPointRisk(newTotal, Math.abs(newRate)),
  }

  return {
    state: nextState,
    explanation: describeDebt(accruals, newTotal),
    delta: totalAccrual,
  }
}

/** Get breakdown of debt by source type */
export function getDebtBreakdown(state: EthicalDebtState): Record<EthicalDebtSourceType, number> {
  const breakdown = {} as Record<EthicalDebtSourceType, number>

  for (const source of state.sources) {
    breakdown[source.type] = (breakdown[source.type] ?? 0) + source.amount
  }

  return breakdown
}

export { DEFAULT_ETHICAL_DEBT }
