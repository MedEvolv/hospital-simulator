/**
 * Automation Drift Engine — unit tests
 * AutomationDriftState fields: aiSystemId, acceptanceRate, overrideRate,
 * averageReviewTimeSeconds, reviewQuality, effectiveAutonomyLevel,
 * declaredAutonomyLevel, driftVelocity, rubberstampingRisk.
 * Engine takes 2 args.
 */

import { updateAutomationDrift } from '@/lib/engines/automationDrift'
import type { AutomationDriftState } from '@/lib/types/governance'
import type { SimEvent } from '@/lib/types'

function makeEvent(event_type: string): SimEvent {
  return {
    run_id: 'test-run',
    event_id: `test-${Math.random().toString(36).slice(2)}`,
    event_type,
    timestamp: 100,
    sequence: 0,
    payload: {},
  }
}

function makeInitialDrift(overrides: Partial<AutomationDriftState> = {}): AutomationDriftState {
  return {
    aiSystemId:              'ai-triage',
    declaredAutonomyLevel:   2,
    effectiveAutonomyLevel:  2.0,
    acceptanceRate:          0.6,
    reviewQuality:           80,
    overrideRate:            0.4,
    rubberstampingRisk:      10,
    driftVelocity:           0.0,
    averageReviewTimeSeconds: 45,
    ...overrides,
  }
}

describe('Automation Drift Engine', () => {
  test('repeated AI actions gradually increase effective autonomy', () => {
    let state = makeInitialDrift()
    for (let i = 0; i < 10; i++) {
      state = updateAutomationDrift(state, makeEvent('AGENT_ACTION')).state
    }
    expect(state.effectiveAutonomyLevel).toBeGreaterThan(makeInitialDrift().effectiveAutonomyLevel)
  })

  test('missed hallucination accelerates automation drift', () => {
    const initial = makeInitialDrift()
    const result = updateAutomationDrift(initial, makeEvent('AI_HALLUCINATION_MISSED'))
    expect(result.state.effectiveAutonomyLevel).toBeGreaterThan(initial.effectiveAutonomyLevel)
    expect(result.state.rubberstampingRisk).toBeGreaterThan(initial.rubberstampingRisk)
  })

  test('human override documentation reduces rubberstamping risk', () => {
    const drifted = makeInitialDrift({ rubberstampingRisk: 40, effectiveAutonomyLevel: 3.5 })
    const result  = updateAutomationDrift(drifted, makeEvent('HUMAN_OVERRIDE_DOCUMENTED'))
    expect(result.state.rubberstampingRisk).toBeLessThan(drifted.rubberstampingRisk)
  })

  test('governance intervention reduces effective autonomy toward declared level', () => {
    const drifted = makeInitialDrift({ declaredAutonomyLevel: 2, effectiveAutonomyLevel: 4.5 })
    const result  = updateAutomationDrift(drifted, makeEvent('GOVERNANCE_INTERVENTION'))
    expect(result.state.effectiveAutonomyLevel).toBeLessThan(drifted.effectiveAutonomyLevel)
  })

  test('explanation is a short readable sentence', () => {
    const result = updateAutomationDrift(
      makeInitialDrift(),
      makeEvent('AI_HALLUCINATION_MISSED'),
    )
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    expect(result.explanation.length).toBeLessThan(300)
  })
})
