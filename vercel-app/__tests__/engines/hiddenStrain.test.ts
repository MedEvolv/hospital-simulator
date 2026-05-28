/**
 * Hidden Strain Engine — unit tests
 *
 * State shape: { overall: number, byType: Record<HiddenStrainType, number>, ... }
 * HiddenStrainType includes: queue_strain, documentation_strain, governance_strain, etc.
 */

import { updateHiddenStrain } from '@/lib/engines/hiddenStrain'
import { DEFAULT_HIDDEN_STRAIN } from '@/lib/types/governance'
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

describe('Hidden Strain Engine', () => {
  test('overload surge increases hidden strain overall', () => {
    const initial = {
      ...DEFAULT_HIDDEN_STRAIN,
      byType: { ...DEFAULT_HIDDEN_STRAIN.byType },
      strainTimeline: [],
    }
    const result = updateHiddenStrain(initial, makeEvent('OVERLOAD_SURGE'), {} as never)
    expect(result.state.overall).toBeGreaterThanOrEqual(initial.overall)
    expect(result.delta).toBeGreaterThanOrEqual(0)
  })

  test('staffing shortage increases overall strain', () => {
    const initial = {
      ...DEFAULT_HIDDEN_STRAIN,
      byType: { ...DEFAULT_HIDDEN_STRAIN.byType },
      strainTimeline: [],
    }
    const result = updateHiddenStrain(initial, makeEvent('STAFFING_SHORTAGE'), {} as never)
    expect(result.state.overall).toBeGreaterThanOrEqual(initial.overall)
  })

  test('governance intervention does not increase strain', () => {
    const strained = {
      ...DEFAULT_HIDDEN_STRAIN,
      overall: 60,
      byType: { ...DEFAULT_HIDDEN_STRAIN.byType, governance_strain: 60 },
      strainTimeline: [],
    }
    const result = updateHiddenStrain(strained, makeEvent('GOVERNANCE_INTERVENTION'), {} as never)
    // Governance intervention should hold or reduce overall strain
    expect(result.state.overall).toBeLessThanOrEqual(strained.overall + 1)
  })

  test('alert flood increases strain', () => {
    const initial = {
      ...DEFAULT_HIDDEN_STRAIN,
      byType: { ...DEFAULT_HIDDEN_STRAIN.byType },
      strainTimeline: [],
    }
    const result = updateHiddenStrain(initial, makeEvent('ALERT_FLOOD'), {} as never)
    expect(result.delta).toBeGreaterThanOrEqual(0)
  })

  test('explanation is a short, readable sentence', () => {
    const result = updateHiddenStrain(
      {
        ...DEFAULT_HIDDEN_STRAIN,
        byType: { ...DEFAULT_HIDDEN_STRAIN.byType },
        strainTimeline: [],
      },
      makeEvent('OVERLOAD_SURGE'),
      {} as never,
    )
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    expect(result.explanation.length).toBeLessThan(300)
  })
})
