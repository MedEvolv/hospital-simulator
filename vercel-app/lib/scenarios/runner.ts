/**
 * Scenario Runner
 *
 * Orchestrates a full scenario run:
 *   1. Calls the Python simulation backend to get the base event log
 *   2. Injects scenario stressor events at specified ticks
 *   3. Replays the augmented log through all six TypeScript governance engines
 *   4. Computes the Five Signal Metrics
 *   5. Generates reflective governance insights
 *   6. Returns a complete ScenarioRunResult
 *
 * The runner is pure TypeScript — it coordinates Python (patient flow)
 * and TypeScript (governance state) without duplicating either layer.
 */

import type { SimEvent, SimulationReport } from '@/lib/types'
import type { FiveSignalMetrics, SignalMetric } from '@/lib/types/simulation'
import type {
  OperationalTrustState,
  HiddenStrainState,
  EthicalDebtState,
  GovernanceDriftState,
  AutomationDriftState,
} from '@/lib/types/governance'

import {
  updateOperationalTrust,
  applyTrustRecovery,
  DEFAULT_OPERATIONAL_TRUST,
} from '@/lib/engines/operationalTrust'
import {
  updateHiddenStrain,
  applyPassiveStrainAccumulation,
  DEFAULT_HIDDEN_STRAIN,
} from '@/lib/engines/hiddenStrain'
import {
  updateEthicalDebt,
  DEFAULT_ETHICAL_DEBT,
} from '@/lib/engines/ethicalDebt'
import {
  updateGovernanceDrift,
  DEFAULT_GOVERNANCE_DRIFT,
} from '@/lib/engines/governanceDrift'
import {
  updateAutomationDrift,
  applyPassiveAutomationDrift,
  createDefaultAutomationDrift,
} from '@/lib/engines/automationDrift'
import {
  updateHumanState,
  applyPassiveHumanRecovery,
  DEFAULT_AGGREGATE_STAFF_STATE,
  type AggregateStaffState,
} from '@/lib/engines/humanState'

import { injectStressors } from './injector'
import type {
  ScenarioConfig,
  ScenarioRunResult,
  GovernanceSnapshot,
  ReflectiveInsight,
} from './schema'

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

/**
 * Compute the Five Signal Metrics from the final governance engine states.
 * All values are 0–100 where 100 = healthy / safe / trusted.
 */
function computeFiveSignals(
  trust: OperationalTrustState,
  strain: HiddenStrainState,
  debt: EthicalDebtState,
  drift: GovernanceDriftState,
  humanState: AggregateStaffState,
  prevTrust?: OperationalTrustState,
  prevStrain?: HiddenStrainState,
  prevDebt?: EthicalDebtState,
  prevDrift?: GovernanceDriftState,
): FiveSignalMetrics {
  // PSS: Patient Safety Signal
  // High trust + low escalation failure risk + low ethical debt = safe
  const pssValue = clamp(
    trust.patientTrust * 0.5 +
    (100 - strain.byType.escalation_strain) * 0.3 +
    (100 - debt.tippingPointRisk) * 0.2,
  )

  // PES: Provider Experience Signal
  // Low fatigue + low burnout + low moral distress + high escalation willingness
  const pesValue = clamp(
    (100 - humanState.fatigue) * 0.25 +
    (100 - humanState.burnout) * 0.25 +
    (100 - humanState.moralDistress) * 0.25 +
    humanState.escalationWillingness * 0.25,
  )

  // SSS: System Strain Signal (inverted — lower strain = better)
  const sssValue = clamp(100 - strain.overall)

  // EIC: Ethical Integrity Coefficient
  // Scale total debt to 0–100: 0 debt = 100, 500+ debt = ~0
  const debtNormalized = clamp(Math.min(100, debt.totalDebt / 5))
  const eicValue = clamp(
    (100 - debtNormalized) * 0.6 +
    (100 - debt.tippingPointRisk) * 0.4,
  )

  // STI: Systemic Trust Index
  // Operational trust adjusted for governance and automation drift
  const autonomyMismatch = clamp(
    Math.abs(drift.effectiveAutonomyLevel - drift.declaredAutonomyLevel) * 10,
  )
  const stiValue = clamp(
    trust.overall * 0.6 +
    (100 - drift.policyPracticeGap) * 0.25 +
    (100 - autonomyMismatch) * 0.15,
  )

  function trend(current: number, prev?: number): 'improving' | 'stable' | 'degrading' {
    if (prev === undefined) return 'stable'
    const delta = current - prev
    if (delta > 2) return 'improving'
    if (delta < -2) return 'degrading'
    return 'stable'
  }

  const prevPSS = prevTrust ? clamp(prevTrust.patientTrust * 0.5 + (100 - (prevStrain?.byType.escalation_strain ?? 0)) * 0.3 + (100 - (prevDebt?.tippingPointRisk ?? 0)) * 0.2) : undefined
  const prevSSS = prevStrain ? clamp(100 - prevStrain.overall) : undefined
  const prevEIC = prevDebt ? clamp((100 - clamp(Math.min(100, prevDebt.totalDebt / 5))) * 0.6 + (100 - prevDebt.tippingPointRisk) * 0.4) : undefined
  const prevSTI = prevTrust && prevDrift ? clamp(prevTrust.overall * 0.6 + (100 - prevDrift.policyPracticeGap) * 0.25 + (100 - clamp(Math.abs(prevDrift.effectiveAutonomyLevel - prevDrift.declaredAutonomyLevel) * 10)) * 0.15) : undefined

  const makeSignal = (
    value: number,
    prev: number | undefined,
    lastEvent: string,
    explanation: string,
  ): SignalMetric => ({
    value: Math.round(value),
    delta: prev !== undefined ? Math.round(value - prev) : 0,
    trend: trend(value, prev),
    explanation,
    lastChangedByEvent: lastEvent,
  })

  return {
    PSS: makeSignal(
      pssValue, prevPSS,
      trust.lastChangeReason,
      `Patient safety at ${pssValue.toFixed(0)}% — driven by patient trust (${trust.patientTrust.toFixed(0)}) and escalation pathway health.`,
    ),
    PES: makeSignal(
      pesValue, undefined,
      'HUMAN_STATE',
      `Provider experience at ${pesValue.toFixed(0)}% — fatigue ${humanState.fatigue.toFixed(0)}, moral distress ${humanState.moralDistress.toFixed(0)}, escalation willingness ${humanState.escalationWillingness.toFixed(0)}.`,
    ),
    SSS: makeSignal(
      sssValue, prevSSS,
      'HIDDEN_STRAIN',
      `System strain at ${(100 - sssValue).toFixed(0)}% — ${strain.overall > 60 ? 'approaching tipping point' : 'within operational range'}.`,
    ),
    EIC: makeSignal(
      eicValue, prevEIC,
      'ETHICAL_DEBT',
      `Ethical integrity at ${eicValue.toFixed(0)}% — ${debt.totalDebt.toFixed(0)} units of accumulated debt across ${debt.affectedGroups.length} affected group(s).`,
    ),
    STI: makeSignal(
      stiValue, prevSTI,
      trust.lastChangeReason,
      `Systemic trust at ${stiValue.toFixed(0)}% — operational trust ${trust.overall.toFixed(0)}, policy-practice gap ${drift.policyPracticeGap.toFixed(0)}%.`,
    ),
  }
}

/**
 * Generate at least four reflective insights from final governance state.
 * Design law: every insight must be readable to a tired nurse at 2 a.m.
 */
function generateReflectiveInsights(
  trust: OperationalTrustState,
  strain: HiddenStrainState,
  debt: EthicalDebtState,
  drift: GovernanceDriftState,
  humanState: AggregateStaffState,
  automationDrifts: AutomationDriftState[],
  scenario: ScenarioConfig,
): ReflectiveInsight[] {
  const insights: ReflectiveInsight[] = []

  // ── Operational insight ───────────────────────────────────────────────────
  if (trust.overall < 60) {
    insights.push({
      type: 'operational',
      severity: trust.overall < 40 ? 'critical' : 'concern',
      title: 'Operational trust has fallen below safe threshold',
      explanation: `Trust is at ${trust.overall.toFixed(0)}% — the system can still function but clinicians no longer rely on it.`,
      affectedConcepts: ['operational_trust', 'escalation_willingness'],
      governanceImplication: 'Low trust predicts increased escalation bypassing and reduced AI oversight quality.',
      suggestedIntervention: 'Document and broadcast three recent cases where the system functioned correctly.',
    })
  } else {
    insights.push({
      type: 'operational',
      severity: 'info',
      title: 'Operational trust held through the scenario',
      explanation: `Trust finished at ${trust.overall.toFixed(0)}% — governance pathways absorbed the stress without institutional trust collapse.`,
      affectedConcepts: ['operational_trust'],
      governanceImplication: 'Trust resilience suggests the escalation pathways are functioning, but watch for delayed decay.',
    })
  }

  // ── Human-state insight ───────────────────────────────────────────────────
  if (humanState.reviewCapacity < 50) {
    insights.push({
      type: 'human_state',
      severity: humanState.reviewCapacity < 30 ? 'critical' : 'concern',
      title: 'Review capacity dropped — AI outputs are not being properly checked',
      explanation: `Review capacity at ${humanState.reviewCapacity.toFixed(0)}% means clinicians are approving AI outputs without reading them.`,
      affectedConcepts: ['review_thoroughness', 'automation_drift', 'rubber_stamping'],
      governanceImplication: 'This scenario demonstrates how fatigue converts declared AI oversight into nominal oversight.',
      suggestedIntervention: 'Require mandatory second-review for high-risk AI outputs when review capacity drops below 60%.',
    })
  } else if (humanState.moralDistress > 50) {
    insights.push({
      type: 'human_state',
      severity: 'concern',
      title: 'Moral distress is accumulating among staff',
      explanation: `Staff moral distress at ${humanState.moralDistress.toFixed(0)}% — they can see the gap between what they should do and what they are doing.`,
      affectedConcepts: ['moral_distress', 'burnout', 'staff_wellbeing'],
      governanceImplication: 'Moral distress leads to either burnout or learned helplessness — both increase governance risk.',
      suggestedIntervention: 'Structured moral case review after high-load periods allows staff to process distress before it compounds.',
    })
  } else {
    insights.push({
      type: 'human_state',
      severity: 'info',
      title: 'Staff capacity held — review quality was maintained',
      explanation: `Review capacity at ${humanState.reviewCapacity.toFixed(0)}% and moral distress at ${humanState.moralDistress.toFixed(0)}% — the staff were under pressure but maintained oversight quality.`,
      affectedConcepts: ['review_capacity', 'staff_resilience'],
      governanceImplication: 'Scenarios that maintain staff capacity demonstrate governance system resilience, not absence of stress.',
    })
  }

  // ── Governance insight ────────────────────────────────────────────────────
  const autonomyMismatch = drift.effectiveAutonomyLevel - drift.declaredAutonomyLevel
  if (autonomyMismatch >= 1.0) {
    insights.push({
      type: 'governance',
      severity: autonomyMismatch >= 2.0 ? 'critical' : 'concern',
      title: 'AI is operating above its declared autonomy level',
      explanation: `The system is declared at L${drift.declaredAutonomyLevel} but effectively operating at L${drift.effectiveAutonomyLevel.toFixed(1)} — policy and practice have diverged.`,
      affectedConcepts: ['autonomy_drift', 'governance_gap', 'rubber_stamping'],
      governanceImplication: 'Undeclared autonomy is the most dangerous form — it cannot be governed because it is not visible.',
      suggestedIntervention: 'Conduct an autonomy audit: how often are AI outputs accepted without documented justification?',
    })
  } else if (drift.policyPracticeGap > 30) {
    insights.push({
      type: 'governance',
      severity: 'concern',
      title: 'Formal policy and actual practice are drifting apart',
      explanation: `Policy-practice gap at ${drift.policyPracticeGap.toFixed(0)}% — the institution has policies that it is not following.`,
      affectedConcepts: ['governance_drift', 'workaround_normalisation'],
      governanceImplication: 'Workarounds become the new normal when they are never explicitly addressed. The gap is the governance problem.',
      suggestedIntervention: 'Map the three most common workarounds and ask: should these become the official policy?',
    })
  } else {
    insights.push({
      type: 'governance',
      severity: 'info',
      title: 'Governance pathways held — policy and practice stayed aligned',
      explanation: `Policy-practice gap at ${drift.policyPracticeGap.toFixed(0)}% and autonomy mismatch at ${autonomyMismatch.toFixed(1)} levels — within acceptable range.`,
      affectedConcepts: ['governance_alignment'],
      governanceImplication: 'Governance alignment under stress is a signal of institutional maturity, not luck.',
    })
  }

  // ── Trust/debt insight ────────────────────────────────────────────────────
  if (debt.totalDebt > 50) {
    const groups = debt.affectedGroups
    insights.push({
      type: 'trust_debt',
      severity: debt.totalDebt > 150 ? 'critical' : 'concern',
      title: `${debt.totalDebt.toFixed(0)} units of ethical debt accumulated`,
      explanation: `Ethical debt is the cost of operating under constraint without resolving the tension. ${groups.length > 0 ? `Groups most affected: ${groups.slice(0, 3).join(', ')}.` : 'No specific groups flagged yet.'}`,
      affectedConcepts: ['ethical_debt', 'fairness', 'accountability'],
      governanceImplication: 'Ethical debt is not blame — it is the cost of not having better systems. It demands institutional action, not individual punishment.',
      suggestedIntervention: 'Conduct a post-scenario review: which decisions could have been made differently given the same constraints?',
    })
  } else {
    insights.push({
      type: 'trust_debt',
      severity: 'info',
      title: 'Ethical debt remained manageable',
      explanation: `${debt.totalDebt.toFixed(0)} units of ethical debt — below the threshold where compounding becomes self-reinforcing.`,
      affectedConcepts: ['ethical_debt'],
      governanceImplication: 'Low debt does not mean no ethical compromise occurred — it means the compromises stayed within the institution\'s declared tolerance.',
    })
  }

  // ── Automation-specific insight (if drift is significant) ─────────────────
  const highDriftSystems = automationDrifts.filter(
    d => d.effectiveAutonomyLevel - d.declaredAutonomyLevel >= 0.5
  )
  if (highDriftSystems.length > 0) {
    const worst = highDriftSystems.sort(
      (a, b) => (b.effectiveAutonomyLevel - b.declaredAutonomyLevel) - (a.effectiveAutonomyLevel - a.declaredAutonomyLevel)
    )[0]
    insights.push({
      type: 'governance',
      severity: worst.rubberstampingRisk > 60 ? 'critical' : 'concern',
      title: `${worst.aiSystemId} is operating above its declared autonomy level`,
      explanation: `Acceptance rate is ${(worst.acceptanceRate * 100).toFixed(0)}% and review quality has decayed to ${worst.reviewQuality.toFixed(0)}% — this AI is operating as L${worst.effectiveAutonomyLevel.toFixed(1)} while declared as L${worst.declaredAutonomyLevel}.`,
      affectedConcepts: ['automation_drift', 'review_decay', 'rubber_stamping'],
      governanceImplication: 'An AI system operating above its declared level is operating outside its governance framework. Any harm it causes has no clear accountability chain.',
      suggestedIntervention: 'Require that every AI acceptance during this period is documented with a justification sentence.',
    })
  }

  return insights
}

// ── Governance replay ─────────────────────────────────────────────────────────

interface GovernanceReplayResult {
  trust: OperationalTrustState
  strain: HiddenStrainState
  debt: EthicalDebtState
  drift: GovernanceDriftState
  automationDrifts: AutomationDriftState[]
  humanState: AggregateStaffState
  timeline: GovernanceSnapshot[]
  lastTrustChange: string
}

function replayGovernanceEngines(
  events: SimEvent[],
  aiSystemIds: string[] = ['generic'],
): GovernanceReplayResult {
  let trust = DEFAULT_OPERATIONAL_TRUST
  let strain = DEFAULT_HIDDEN_STRAIN
  let debt = DEFAULT_ETHICAL_DEBT
  let drift = DEFAULT_GOVERNANCE_DRIFT
  let humanState: AggregateStaffState = { ...DEFAULT_AGGREGATE_STAFF_STATE }

  // One AutomationDriftState per AI system in scope
  const automationDriftMap = new Map<string, AutomationDriftState>(
    aiSystemIds.map(id => [id, createDefaultAutomationDrift(id, 2)])
  )

  const timeline: GovernanceSnapshot[] = []
  let lastSnapshotTick = -1
  const SNAPSHOT_INTERVAL = 30  // ticks

  for (const event of events) {
    const tickApprox = Math.floor(event.timestamp / 5)

    // Passive drift every 30 ticks (only once per interval)
    if (tickApprox > 0 && tickApprox % SNAPSHOT_INTERVAL === 0 && tickApprox !== lastSnapshotTick) {
      strain = applyPassiveStrainAccumulation(strain, 1)
      trust = applyTrustRecovery(trust, 1)
      humanState = applyPassiveHumanRecovery(humanState, 1)
      for (const [id, adState] of automationDriftMap) {
        automationDriftMap.set(id, applyPassiveAutomationDrift(adState, 1))
      }

      timeline.push({
        tick: tickApprox,
        trust: Math.round(trust.overall),
        hiddenStrain: Math.round(strain.overall),
        ethicalDebt: Math.round(debt.totalDebt),
        policyPracticeGap: Math.round(drift.policyPracticeGap),
        effectiveAutonomy: Math.round(drift.effectiveAutonomyLevel * 10) / 10,
        reviewCapacity: Math.round(humanState.reviewCapacity),
        escalationWillingness: Math.round(humanState.escalationWillingness),
      })
      lastSnapshotTick = tickApprox
    }

    // Apply event to each engine
    const trustResult = updateOperationalTrust(trust, event)
    trust = trustResult.state

    const strainResult = updateHiddenStrain(strain, event)
    strain = strainResult.state

    const debtResult = updateEthicalDebt(debt, event)
    debt = debtResult.state

    const driftResult = updateGovernanceDrift(drift, event)
    drift = driftResult.state

    const humanResult = updateHumanState(humanState, event)
    humanState = humanResult.state

    // Apply to all tracked AI systems
    for (const [id, adState] of automationDriftMap) {
      const adResult = updateAutomationDrift(adState, event)
      automationDriftMap.set(id, adResult.state)
    }
  }

  return {
    trust,
    strain,
    debt,
    drift,
    automationDrifts: Array.from(automationDriftMap.values()),
    humanState,
    timeline,
    lastTrustChange: trust.lastChangeReason,
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────

/**
 * Run a scenario end-to-end.
 *
 * baseReport: the SimulationReport returned by the Python simulation backend.
 * The caller is responsible for fetching it (see /api/run-scenario/route.ts).
 */
export async function runScenario(
  scenario: ScenarioConfig,
  baseReport: SimulationReport,
): Promise<ScenarioRunResult> {
  const baseEvents = baseReport.event_log ?? []
  const runId = baseReport.run_id

  // 1. Inject stressor events
  const { events: augmentedEvents, injectedCount } = injectStressors(
    baseEvents,
    runId,
    scenario.stressors,
  )

  // 2. Determine AI system IDs in scope
  const aiSystemIds = scenario.aiSystems
    ? scenario.aiSystems.map(s => s.id)
    : ['generic']

  // 3. Replay all governance engines over augmented event log
  const governance = replayGovernanceEngines(augmentedEvents, aiSystemIds)

  // 4. Compute Five Signal Metrics
  const fiveSignals = computeFiveSignals(
    governance.trust,
    governance.strain,
    governance.debt,
    governance.drift,
    governance.humanState,
  )

  // 5. Generate reflective insights (Phase 1 hard gate: ≥1 per category)
  const reflectiveInsights = generateReflectiveInsights(
    governance.trust,
    governance.strain,
    governance.debt,
    governance.drift,
    governance.humanState,
    governance.automationDrifts,
    scenario,
  )

  return {
    scenario,
    runId,
    seed: baseReport.seed,
    timestamp: baseReport.timestamp,
    events: augmentedEvents,
    baseEventCount: baseEvents.length,
    injectedEventCount: injectedCount,
    governanceState: {
      trust: governance.trust,
      hiddenStrain: governance.strain,
      ethicalDebt: governance.debt,
      governanceDrift: governance.drift,
      automationDrift: governance.automationDrifts,
      humanState: governance.humanState,
    },
    fiveSignals,
    governanceTimeline: governance.timeline,
    reflectiveInsights,
  }
}
