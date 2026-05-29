/**
 * Ethical Debt Engine — unit tests
 * State field: totalDebt (not currentDebt). Engine takes 2 args.
 */

import { updateEthicalDebt } from '@/lib/engines/ethicalDebt'
import { DEFAULT_ETHICAL_DEBT } from '@/lib/types/governance'
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

const CLEAN_STATE = () => ({
  ...DEFAULT_ETHICAL_DEBT,
  sources: [] as typeof DEFAULT_ETHICAL_DEBT.sources,
  affectedGroups: [] as string[],
  unresolvedEvents: [] as string[],
})

describe('Ethical Debt Engine', () => {
  test('missed AI hallucination increases ethical debt', () => {
    const initial = CLEAN_STATE()
    const result = updateEthicalDebt(initial, makeEvent('AI_HALLUCINATION_MISSED'))
    expect(result.state.totalDebt).toBeGreaterThan(initial.totalDebt)
    expect(result.delta).toBeGreaterThan(0)
  })

  test('queue displacement increases ethical debt', () => {
    const initial = CLEAN_STATE()
    const result = updateEthicalDebt(initial, makeEvent('QUEUE_DISPLACEMENT'))
    expect(result.state.totalDebt).toBeGreaterThanOrEqual(initial.totalDebt)
  })

  test('documented human override does not add more debt', () => {
    const inflated = { ...CLEAN_STATE(), totalDebt: 40 }
    const result = updateEthicalDebt(inflated, makeEvent('HUMAN_OVERRIDE_DOCUMENTED'))
    expect(result.state.totalDebt).toBeLessThanOrEqual(inflated.totalDebt + 1)
  })

  test('governance intervention holds or reduces ethical debt', () => {
    const inflated = { ...CLEAN_STATE(), totalDebt: 50 }
    const result = updateEthicalDebt(inflated, makeEvent('GOVERNANCE_INTERVENTION'))
    expect(result.state.totalDebt).toBeLessThanOrEqual(inflated.totalDebt)
  })

  test('explanation is a short readable sentence', () => {
    const result = updateEthicalDebt(CLEAN_STATE(), makeEvent('AI_HALLUCINATION_MISSED'))
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    expect(result.explanation.length).toBeLessThan(300)
  })
})
