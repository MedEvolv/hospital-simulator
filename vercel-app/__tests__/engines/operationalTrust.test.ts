/**
 * Operational Trust Engine — unit tests
 *
 * Invariant: every assertion must be legible to a tired nurse at 2 a.m.
 * Test names describe the governance reality, not the code path.
 */

import { updateOperationalTrust } from '@/lib/engines/operationalTrust'
import { DEFAULT_OPERATIONAL_TRUST } from '@/lib/types/governance'
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

describe('Operational Trust Engine', () => {
  test('escalation failure reduces trust', () => {
    const initial = { ...DEFAULT_OPERATIONAL_TRUST }
    const result = updateOperationalTrust(initial, makeEvent('ESCALATION_FAILED'), {} as never)
    expect(result.state.overall).toBeLessThan(initial.overall)
    expect(result.delta).toBeLessThan(0)
  })

  test('missed AI hallucination causes a larger trust drop than a failed escalation', () => {
    const initial = { ...DEFAULT_OPERATIONAL_TRUST }
    const afterHallucination = updateOperationalTrust(initial, makeEvent('AI_HALLUCINATION_MISSED'), {} as never)
    const afterEscalation    = updateOperationalTrust(initial, makeEvent('ESCALATION_FAILED'),       {} as never)
    // Hallucination should hit harder (AI_HALLUCINATION_MISSED = -15 vs ESCALATION_FAILED = -12)
    expect(afterHallucination.state.overall).toBeLessThan(afterEscalation.state.overall)
  })

  test('successful escalation restores some trust', () => {
    // Start with degraded trust so there is room to restore
    const degraded = { ...DEFAULT_OPERATIONAL_TRUST, overall: 55 }
    const result = updateOperationalTrust(degraded, makeEvent('ESCALATION_SUCCESS'), {} as never)
    expect(result.state.overall).toBeGreaterThan(degraded.overall)
    expect(result.delta).toBeGreaterThan(0)
  })

  test('ransomware trigger is the most severe single trust event', () => {
    const initial = { ...DEFAULT_OPERATIONAL_TRUST }
    const afterRansomware     = updateOperationalTrust(initial, makeEvent('RANSOMWARE_TRIGGER'),      {} as never)
    const afterDataBreach     = updateOperationalTrust(initial, makeEvent('DATA_ACCESS_BREACH'),      {} as never)
    const afterHallucination  = updateOperationalTrust(initial, makeEvent('AI_HALLUCINATION_MISSED'), {} as never)
    // Ransomware (-25) hits harder than breach (-18) and hallucination (-15)
    expect(afterRansomware.state.overall).toBeLessThan(afterDataBreach.state.overall)
    expect(afterRansomware.state.overall).toBeLessThan(afterHallucination.state.overall)
  })

  test('explanation is a short, readable sentence', () => {
    const result = updateOperationalTrust(
      { ...DEFAULT_OPERATIONAL_TRUST },
      makeEvent('ESCALATION_FAILED'),
      {} as never,
    )
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation.length).toBeGreaterThan(5)
    // Longer than 300 chars is not readable at 2am
    expect(result.explanation.length).toBeLessThan(300)
  })
})
