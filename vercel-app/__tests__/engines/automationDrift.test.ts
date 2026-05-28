/**
 * Automation Drift Engine — unit tests
 *
 * Drift is the gap between declared AI autonomy and actual operating behaviour.
 * The engine detects when humans are rubber-stamping rather than reviewing.
 */

import { updateAutomationDrift } from '@/lib/engines/automationDrift'
import type { AutomationDriftState } from '@/lib/types/governance'
import type { SimEvent } from '@/lib/types'

function makeEvent(event_type: string, overrides: Partial<SimEvent> = {}): SimEvent {
  return {
    event_id: `test-${Math.random().toString(36).slice(2)}`,
    event_type,
    timestamp: 100,
    actor: 'test',
    payload: {},
    ...overrides,
  }
}

function makeInitialDrift(overrides: Partial<AutomationDriftState> = {}): AutomationDriftState {
  return {
    systemId:              'ai-triage',
    systemName:            'AI Triage Assistant',
    declaredAutonomyLevel: 2,
    effectiveAutonomyLevel: 2.0,
    acceptanceRate:        0.6,
    reviewQuality:         80,
    overrideRate:          0.4,
    rubberstampingRisk:    10,
    driftMagnitude:        0.0,
    workflowArea:          'triage',
    supervisionDecay:      false,
    lastUpdateTick:        0,
    ...overrides,
  }
}

describe('Automation Drift Engine', () => {
  test('repeated AI actions without oversight gradually increase drift', () => {
    let state = makeInitialDrift()
    // Simulate 10 successive AI actions
    for (let i = 0; i < 10; i++) {
      const result = updateAutomationDrift(state, makeEvent('AGENT_ACTION'), {} as never)
      state = result.state
    }
    // After 10 unchecked AI actions, effective autonomy should have crept up
    expect(state.effectiveAutonomyLevel).toBeGreaterThan(makeInitialDrift().effectiveAutonomyLevel)
  })

  test('missed hallucination accelerates automation drift', () => {
    const initial = makeInitialDrift()
    const result = updateAutomationDrift(initial, makeEvent('AI_HALLUCINATION_MISSED'), {} as never)
    expect(result.state.effectiveAutonomyLevel).toBeGreaterThan(initial.effectiveAutonomyLevel)
    expect(result.state.rubberstampingRisk).toBeGreaterThan(initial.rubberstampingRisk)
  })

  test('human override documentation reduces rubberstamping risk', () => {
    const drifted = makeInitialDrift({ rubberstampingRisk: 40, effectiveAutonomyLevel: 3.5 })
    const result  = updateAutomationDrift(drifted, makeEvent('HUMAN_OVERRIDE_DOCUMENTED'), {} as never)
    expect(result.state.rubberstampingRisk).toBeLessThan(drifted.rubberstampingRisk)
  })

  test('governance intervention reduces effective autonomy toward declared level', () => {
    const drifted = makeInitialDrift({ declaredAutonomyLevel: 2, effectiveAutonomyLevel: 4.5 })
    const result  = updateAutomationDrift(drifted, makeEvent('GOVERNANCE_INTERVENTION'), {} as never)
    expect(result.state.effectiveAutonomyLevel).toBeLessThan(drifted.effectiveAutonomyLevel)
  })

  test('explanation is a short, readable sentence', () => {
    const result = updateAutomationDrift(
      makeInitialDrift(),
      makeEvent('AI_HALLUCINATION_MISSED'),
      {} as never,
    )
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    expect(result.explanation.length).toBeLessThan(300)
  })
})
