/**
 * Governance Drift Engine — unit tests
 *
 * Governance drift is the widening gap between policy intent and
 * actual institutional behaviour. It accumulates invisibly until
 * it becomes structural.
 */

import { updateGovernanceDrift } from '@/lib/engines/governanceDrift'
import { DEFAULT_GOVERNANCE_DRIFT } from '@/lib/types/governance'
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

describe('Governance Drift Engine', () => {
  test('accountability ambiguity increases governance drift', () => {
    const initial = { ...DEFAULT_GOVERNANCE_DRIFT }
    const result = updateGovernanceDrift(initial, makeEvent('ACCOUNTABILITY_AMBIGUOUS'))
    expect(result.state.policyPracticeGap).toBeGreaterThan(initial.policyPracticeGap)
    expect(result.delta).toBeGreaterThan(0)
  })

  test('escalation failure increases drift by widening the policy-practice gap', () => {
    const initial = { ...DEFAULT_GOVERNANCE_DRIFT }
    const result = updateGovernanceDrift(initial, makeEvent('ESCALATION_FAILED'))
    expect(result.state.policyPracticeGap).toBeGreaterThan(initial.policyPracticeGap)
  })

  test('governance intervention reduces the policy-practice gap', () => {
    const drifted = { ...DEFAULT_GOVERNANCE_DRIFT, policyPracticeGap: 50 }
    const result  = updateGovernanceDrift(drifted, makeEvent('GOVERNANCE_INTERVENTION'))
    expect(result.state.policyPracticeGap).toBeLessThan(drifted.policyPracticeGap)
    expect(result.delta).toBeLessThan(0)
  })

  test('human override documented reduces drift — accountability is restored', () => {
    const drifted = { ...DEFAULT_GOVERNANCE_DRIFT, policyPracticeGap: 40 }
    const result  = updateGovernanceDrift(drifted, makeEvent('HUMAN_OVERRIDE_DOCUMENTED'))
    expect(result.state.policyPracticeGap).toBeLessThanOrEqual(drifted.policyPracticeGap)
  })

  test('explanation is a short, readable sentence', () => {
    const result = updateGovernanceDrift(
      { ...DEFAULT_GOVERNANCE_DRIFT },
      makeEvent('ACCOUNTABILITY_AMBIGUOUS'),
    )
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    expect(result.explanation.length).toBeLessThan(300)
  })
})
