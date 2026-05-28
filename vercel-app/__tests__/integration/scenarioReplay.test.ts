/**
 * Scenario Replay Integration Tests
 *
 * These tests run the governance engine pipeline directly over scenario
 * stressor events — without the Python simulation backend.
 *
 * Each scenario has a well-defined stressor sequence. We inject those
 * events into an empty base log, replay through every governance engine,
 * and assert that the expected governance signals are present.
 *
 * No mocks. No network. Pure TypeScript engine pipeline.
 */

import { injectStressors } from '@/lib/scenarios/injector'
import type { ScenarioStressor } from '@/lib/scenarios/schema'
import type { SimEvent } from '@/lib/types'
import {
  updateOperationalTrust,
  DEFAULT_OPERATIONAL_TRUST,
} from '@/lib/engines/operationalTrust'
import {
  updateAutomationDrift,
  createDefaultAutomationDrift,
} from '@/lib/engines/automationDrift'
import {
  updateEthicalDebt,
  DEFAULT_ETHICAL_DEBT,
} from '@/lib/engines/ethicalDebt'
import {
  updateGovernanceDrift,
  DEFAULT_GOVERNANCE_DRIFT,
} from '@/lib/engines/governanceDrift'

// ── Replay helpers ────────────────────────────────────────────────────────────

function replayEvents(events: SimEvent[]) {
  let trust     = { ...DEFAULT_OPERATIONAL_TRUST }
  let debt      = { ...DEFAULT_ETHICAL_DEBT }
  let drift     = { ...DEFAULT_GOVERNANCE_DRIFT }
  let autoDrift = createDefaultAutomationDrift('test-ai', 2)

  for (const event of events) {
    trust     = updateOperationalTrust(trust, event).state
    debt      = updateEthicalDebt(debt, event).state
    drift     = updateGovernanceDrift(drift, event).state
    autoDrift = updateAutomationDrift(autoDrift, event).state
  }

  return { trust, debt, drift, autoDrift }
}

/**
 * Convert scenario stressors to SimEvents via the injector (empty base log).
 */
function stressorsToEvents(stressors: ScenarioStressor[], runId = 'test-run'): SimEvent[] {
  const { events } = injectStressors([], runId, stressors)
  return events
}

// ── Scenario 1: hallucinated-discharge-summary ────────────────────────────────

const hallucinatedDischargeSummaryStressors: ScenarioStressor[] = [
  { triggerTick: 20,  type: 'STAFFING_SHORTAGE',       magnitude: 0.6, affectedSystems: ['discharge-summary-llm'], narrative: 'Resident calls in sick.' },
  { triggerTick: 40,  type: 'OVERLOAD_SURGE',           magnitude: 0.7, affectedSystems: ['discharge-summary-llm'], narrative: 'Bed pressure spike.' },
  { triggerTick: 65,  type: 'AI_HALLUCINATION_MISSED',  magnitude: 1.0, affectedSystems: ['discharge-summary-llm'], narrative: 'LLM hallucinates medication dose; resident scan-reads and signs off.' },
  { triggerTick: 90,  type: 'ACCOUNTABILITY_AMBIGUOUS', magnitude: 0.8, affectedSystems: ['discharge-summary-llm'], narrative: 'Pharmacist flags error. Nobody owns it.' },
  { triggerTick: 120, type: 'ESCALATION_FAILED',        magnitude: 0.7, affectedSystems: ['discharge-summary-llm'], narrative: 'No active clinical AI escalation pathway.' },
  { triggerTick: 150, type: 'GOVERNANCE_INTERVENTION',  magnitude: 0.5, affectedSystems: ['discharge-summary-llm'], narrative: 'Medical director mandates second-check policy.' },
]

describe('Scenario: hallucinated-discharge-summary', () => {
  const events = stressorsToEvents(hallucinatedDischargeSummaryStressors)

  test('produces a distinct automation drift (hallucination accelerates effective autonomy)', () => {
    const { autoDrift } = replayEvents(events)
    expect(autoDrift.effectiveAutonomyLevel).toBeGreaterThan(
      createDefaultAutomationDrift('test-ai', 2).effectiveAutonomyLevel,
    )
  })

  test('produces ethical debt from missed hallucination', () => {
    const { debt } = replayEvents(events)
    expect(debt.totalDebt).toBeGreaterThan(0)
  })

  test('reduces governance trust via escalation failure and accountability ambiguity', () => {
    const { trust } = replayEvents(events)
    expect(trust.overall).toBeLessThan(DEFAULT_OPERATIONAL_TRUST.overall)
  })

  test('governance intervention partially arrests policy-practice gap', () => {
    // With intervention at tick 150, gap should be lower than mid-scenario maximum
    const withoutIntervention = stressorsToEvents(hallucinatedDischargeSummaryStressors.slice(0, -1))
    const withIntervention    = stressorsToEvents(hallucinatedDischargeSummaryStressors)
    const r1 = replayEvents(withoutIntervention)
    const r2 = replayEvents(withIntervention)
    expect(r2.drift.policyPracticeGap).toBeLessThan(r1.drift.policyPracticeGap)
  })
})

// ── Scenario 2: chronic-patient-scheduling-delay ──────────────────────────────

const chronicSchedulingStressors: ScenarioStressor[] = [
  { triggerTick: 15,  type: 'QUEUE_DISPLACEMENT',        magnitude: 0.5, affectedSystems: ['scheduling-optimizer'], narrative: 'Multi-morbidity patient moved to later slot.' },
  { triggerTick: 30,  type: 'QUEUE_DISPLACEMENT',        magnitude: 0.6, affectedSystems: ['scheduling-optimizer'], narrative: 'Five chronic patients moved down in 3 days.' },
  { triggerTick: 55,  type: 'QUEUE_DISPLACEMENT',        magnitude: 0.7, affectedSystems: ['scheduling-optimizer'], narrative: 'Hypertension patient deferred for third week.' },
  { triggerTick: 70,  type: 'ACCOUNTABILITY_AMBIGUOUS',  magnitude: 0.6, affectedSystems: ['scheduling-optimizer'], narrative: 'Nobody owns the algorithm decision.' },
  { triggerTick: 85,  type: 'ESCALATION_FAILED',         magnitude: 0.6, affectedSystems: ['scheduling-optimizer'], narrative: 'Governance committee defers — contractual system.' },
  { triggerTick: 110, type: 'QUEUE_DISPLACEMENT',        magnitude: 0.8, affectedSystems: ['scheduling-optimizer'], narrative: '72-year-old misses medication review for fourth time.' },
  { triggerTick: 140, type: 'HUMAN_OVERRIDE_DOCUMENTED', magnitude: 0.7, affectedSystems: ['scheduling-optimizer'], narrative: 'Dr Sharma manually reschedules 12 chronic patients.' },
  { triggerTick: 165, type: 'GOVERNANCE_INTERVENTION',   magnitude: 0.6, affectedSystems: ['scheduling-optimizer'], narrative: 'CMO mandates 60-day audit.' },
  { triggerTick: 200, type: 'ESCALATION_SUCCESS',        magnitude: 0.8, affectedSystems: ['scheduling-optimizer'], narrative: '34 displaced patients found; board presentation.' },
]

describe('Scenario: chronic-patient-scheduling-delay', () => {
  const events = stressorsToEvents(chronicSchedulingStressors)

  test('accrues fairness debt from repeated queue displacement', () => {
    const initial = { ...DEFAULT_ETHICAL_DEBT, sources: [], affectedGroups: [], unresolvedEvents: [] }
    const { debt } = replayEvents(events)
    expect(debt.totalDebt).toBeGreaterThan(initial.totalDebt)
  })

  test('queue displacement debt exceeds governance-only debt (equity gap)', () => {
    // A governance-only sequence should produce less debt than a sequence with queue displacements
    const noDisplacementStressors = chronicSchedulingStressors.filter(
      s => s.type !== 'QUEUE_DISPLACEMENT',
    )
    const withDisplacement    = replayEvents(stressorsToEvents(chronicSchedulingStressors))
    const withoutDisplacement = replayEvents(stressorsToEvents(noDisplacementStressors))
    expect(withDisplacement.debt.totalDebt).toBeGreaterThan(withoutDisplacement.debt.totalDebt)
  })

  test('governance intervention + escalation success partially repair trust', () => {
    // Run without the final two restorative events, then with — trust should be higher with them
    const withRestore    = stressorsToEvents(chronicSchedulingStressors)
    const withoutRestore = stressorsToEvents(chronicSchedulingStressors.filter(
      s => !['GOVERNANCE_INTERVENTION', 'ESCALATION_SUCCESS', 'HUMAN_OVERRIDE_DOCUMENTED'].includes(s.type),
    ))
    const r1 = replayEvents(withoutRestore)
    const r2 = replayEvents(withRestore)
    expect(r2.trust.overall).toBeGreaterThanOrEqual(r1.trust.overall)
  })

  test('workaround normalisation score is elevated after repeated accountability failures', () => {
    // ACCOUNTABILITY_AMBIGUOUS (+6) + ESCALATION_FAILED (+4) outpace restoration events
    // even after GOVERNANCE_INTERVENTION and ESCALATION_SUCCESS
    const { drift } = replayEvents(events)
    expect(drift.workaroundNormalizationScore).toBeGreaterThan(DEFAULT_GOVERNANCE_DRIFT.workaroundNormalizationScore)
  })
})

// ── Scenario 3: ai-triage-drift-er-overload ───────────────────────────────────

const aiTriageDriftStressors: ScenarioStressor[] = [
  { triggerTick: 10,  type: 'OVERLOAD_SURGE',           magnitude: 0.9, affectedSystems: ['triage-ai'], narrative: 'MVC sends 40 patients in 90 minutes.' },
  { triggerTick: 25,  type: 'ALERT_FLOOD',              magnitude: 0.8, affectedSystems: ['triage-ai'], narrative: '73 alerts in 15 minutes; staff begin dismissing.' },
  { triggerTick: 42,  type: 'ALERT_SUPPRESSION',        magnitude: 0.7, affectedSystems: ['triage-ai'], narrative: 'Senior nurse instructs: dismiss non-critical alerts.' },
  { triggerTick: 60,  type: 'ESCALATION_FAILED',        magnitude: 0.8, affectedSystems: ['triage-ai'], narrative: 'Junior doctor cannot reach registrar; accepts AI under time pressure.' },
  { triggerTick: 80,  type: 'QUEUE_DISPLACEMENT',       magnitude: 0.9, affectedSystems: ['triage-ai'], narrative: 'Chronic-illness patient de-prioritised algorithmically.' },
  { triggerTick: 95,  type: 'ACCOUNTABILITY_AMBIGUOUS', magnitude: 0.6, affectedSystems: ['triage-ai'], narrative: 'Patient deteriorates; registrar + vendor + nurse share responsibility.' },
  { triggerTick: 120, type: 'GOVERNANCE_INTERVENTION',  magnitude: 0.7, affectedSystems: ['triage-ai'], narrative: 'Medical director mandates mandatory human confirmation for de-prioritisation.' },
  { triggerTick: 145, type: 'ESCALATION_SUCCESS',       magnitude: 0.8, affectedSystems: ['triage-ai'], narrative: 'New escalation pathway used successfully.' },
]

describe('Scenario: ai-triage-drift-er-overload', () => {
  const events = stressorsToEvents(aiTriageDriftStressors)

  test('escalation failure reduces operational trust', () => {
    const escalationFailureOnly = stressorsToEvents([aiTriageDriftStressors[3]])  // ESCALATION_FAILED only
    const { trust } = replayEvents(escalationFailureOnly)
    expect(trust.overall).toBeLessThan(DEFAULT_OPERATIONAL_TRUST.overall)
  })

  test('alert flood accelerates automation drift', () => {
    const alertFloodOnly = stressorsToEvents([aiTriageDriftStressors[1]])  // ALERT_FLOOD only
    const { autoDrift } = replayEvents(alertFloodOnly)
    expect(autoDrift.effectiveAutonomyLevel).toBeGreaterThan(
      createDefaultAutomationDrift('test-ai', 2).effectiveAutonomyLevel,
    )
  })

  test('surge + alert flood + alert suppression sequence produces more drift than surge alone', () => {
    const surgeOnly    = stressorsToEvents([aiTriageDriftStressors[0]])
    const surgeAndMore = stressorsToEvents(aiTriageDriftStressors.slice(0, 3))
    const r1 = replayEvents(surgeOnly)
    const r2 = replayEvents(surgeAndMore)
    expect(r2.autoDrift.effectiveAutonomyLevel).toBeGreaterThan(r1.autoDrift.effectiveAutonomyLevel)
  })

  test('governance intervention after full scenario reduces policy-practice gap', () => {
    const withoutGov = stressorsToEvents(aiTriageDriftStressors.filter(
      s => !['GOVERNANCE_INTERVENTION', 'ESCALATION_SUCCESS'].includes(s.type),
    ))
    const withGov = stressorsToEvents(aiTriageDriftStressors)
    const r1 = replayEvents(withoutGov)
    const r2 = replayEvents(withGov)
    expect(r2.drift.policyPracticeGap).toBeLessThan(r1.drift.policyPracticeGap)
  })

  test('accumulated ethical debt persists even after intervention', () => {
    const { debt } = replayEvents(events)
    // Debt from queue displacement and hallucination should still be above baseline
    // even after governance intervention (debt doesn't erase, it only slows)
    expect(debt.totalDebt).toBeGreaterThan(0)
  })
})
