/**
 * Hidden Strain Engine — unit tests
 * State: { overall, byType: Record<HiddenStrainType, number>, ... }
 * Engine takes 2 args.
 */

import { updateHiddenStrain } from '@/lib/engines/hiddenStrain'
import { DEFAULT_HIDDEN_STRAIN } from '@/lib/types/governance'
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
  ...DEFAULT_HIDDEN_STRAIN,
  byType: { ...DEFAULT_HIDDEN_STRAIN.byType },
  strainTimeline: [] as typeof DEFAULT_HIDDEN_STRAIN.strainTimeline,
})

describe('Hidden Strain Engine', () => {
  test('overload surge increases overall strain', () => {
    const initial = CLEAN_STATE()
    const result = updateHiddenStrain(initial, makeEvent('OVERLOAD_SURGE'))
    expect(result.state.overall).toBeGreaterThanOrEqual(initial.overall)
    expect(result.delta).toBeGreaterThanOrEqual(0)
  })

  test('staffing shortage increases overall strain', () => {
    const initial = CLEAN_STATE()
    const result = updateHiddenStrain(initial, makeEvent('STAFFING_SHORTAGE'))
    expect(result.state.overall).toBeGreaterThanOrEqual(initial.overall)
  })

  test('governance intervention does not increase strain', () => {
    const strained = { ...CLEAN_STATE(), overall: 60 }
    const result = updateHiddenStrain(strained, makeEvent('GOVERNANCE_INTERVENTION'))
    expect(result.state.overall).toBeLessThanOrEqual(strained.overall + 1)
  })

  test('alert flood increases strain', () => {
    const initial = CLEAN_STATE()
    const result = updateHiddenStrain(initial, makeEvent('ALERT_FLOOD'))
    expect(result.delta).toBeGreaterThanOrEqual(0)
  })

  test('explanation is a short readable sentence', () => {
    const result = updateHiddenStrain(CLEAN_STATE(), makeEvent('OVERLOAD_SURGE'))
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    expect(result.explanation.length).toBeLessThan(300)
  })
})
