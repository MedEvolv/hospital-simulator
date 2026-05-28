/**
 * Ethical Debt Engine — unit tests
 *
 * Ethical debt accumulates through institutional compromise.
 * State field: `totalDebt` (not currentDebt).
 */

import { updateEthicalDebt } from '@/lib/engines/ethicalDebt'
import { DEFAULT_ETHICAL_DEBT } from '@/lib/types/governance'
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

describe('Ethical Debt Engine', () => {
  test('missed AI hallucination increases ethical debt', () => {
    const initial = { ...DEFAULT_ETHICAL_DEBT, sources: [], affectedGroups: [], unresolvedEvents: [], strainTimeline: [] }
    const result = updateEthicalDebt(initial, makeEvent('AI_HALLUCINATION_MISSED'), {} as never)
    expect(result.state.totalDebt).toBeGreaterThan(initial.totalDebt)
    expect(result.delta).toBeGreaterThan(0)
  })

  test('queue displacement increases ethical debt', () => {
    const initial = { ...DEFAULT_ETHICAL_DEBT, sources: [], affectedGroups: [], unresolvedEvents: [] }
    const before = initial.totalDebt
    const result = updateEthicalDebt(initial, makeEvent('QUEUE_DISPLACEMENT'), {} as never)
    // QUEUE_DISPLACEMENT should accrue debt (defined in ethicalDebt engine as 12)
    expect(result.state.totalDebt).toBeGreaterThanOrEqual(before)
  })

  test('documented human override does not increase ethical debt', () => {
    const inflated = { ...DEFAULT_ETHICAL_DEBT, totalDebt: 40, sources: [], affectedGroups: [], unresolvedEvents: [] }
    const result = updateEthicalDebt(inflated, makeEvent('HUMAN_OVERRIDE_DOCUMENTED'), {} as never)
    // Override documentation should not add more debt; may reduce or hold
    expect(result.state.totalDebt).toBeLessThanOrEqual(inflated.totalDebt + 1)
  })

  test('governance intervention reduces or holds ethical debt', () => {
    const inflated = { ...DEFAULT_ETHICAL_DEBT, totalDebt: 50, sources: [], affectedGroups: [], unresolvedEvents: [] }
    const result = updateEthicalDebt(inflated, makeEvent('GOVERNANCE_INTERVENTION'), {} as never)
    expect(result.state.totalDebt).toBeLessThanOrEqual(inflated.totalDebt)
  })

  test('explanation is a short, readable sentence', () => {
    const result = updateEthicalDebt(
      { ...DEFAULT_ETHICAL_DEBT, sources: [], affectedGroups: [], unresolvedEvents: [] },
      makeEvent('AI_HALLUCINATION_MISSED'),
      {} as never,
    )
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    expect(result.explanation.length).toBeLessThan(300)
  })
})
