/**
 * Five-signal reconciliation — regression guard.
 *
 * Locks the 2026-06-13 correctness fix: the five signals come from the Python scoring
 * engine (canonical), mapped — never re-derived in TS with drifted semantics. If anyone
 * re-introduces the drift (PES→Provider, SSS→System Strain, EIC→Integrity-Coefficient,
 * STI→Systemic-Trust) or treats EIC as a 0–100 score instead of a count, this fails.
 *
 * This is the "living practice" that keeps the docs-as-types mirror honest (CANON_ALIGNMENT §7).
 */

import { computeFiveSignals } from '@/lib/scenarios/runner'
import { SIGNAL_DEFINITIONS } from '@/lib/domain'
import type { PerformanceScores } from '@/lib/types'

const SCORES: PerformanceScores = {
  patient_safety_score: 61,
  patient_experience_score: 55,
  staff_stress_score: 38,
  ethics_intervention_count: 7, // a COUNT, deliberately not on a 0–100 scale
  system_throughput_index: 72,
  interpretation: 'Throughput maintained at some cost to staff stress and patient experience.',
}

describe('five-signal reconciliation: canonical mapping from the Python engine', () => {
  const signals = computeFiveSignals(SCORES)

  it('maps each canonical Python score to the right signal (no re-derivation)', () => {
    expect(signals.PSS.value).toBe(SCORES.patient_safety_score)
    expect(signals.PES.value).toBe(SCORES.patient_experience_score)
    expect(signals.SSS.value).toBe(SCORES.staff_stress_score)
    expect(signals.STI.value).toBe(SCORES.system_throughput_index)
  })

  it('passes EIC through as a COUNT, not a 0–100 score (RULE-M4)', () => {
    // The count (7) is carried verbatim — never normalised to a 0–100 "integrity coefficient".
    expect(signals.EIC.value).toBe(SCORES.ethics_intervention_count)
  })

  it('uses canonical signal names in the explanations (guards against label drift)', () => {
    expect(signals.PES.explanation).toContain('Patient Experience')
    expect(signals.SSS.explanation).toContain('Staff Stress')
    expect(signals.EIC.explanation).toContain('Ethics Intervention Count')
    expect(signals.STI.explanation).toContain('System Throughput')
    // The drifted names must NOT appear.
    const all = Object.values(signals).map((s) => s.explanation).join(' ')
    expect(all).not.toMatch(/Provider Experience|System Strain|Systemic Trust|Ethical Integrity Coefficient/)
  })

  it('marks PYTHON_SCORING as the source (RULE-A2: the engine scores, the UI renders)', () => {
    expect(signals.PSS.lastChangedByEvent).toBe('PYTHON_SCORING')
  })
})

describe('docs-as-types: the canonical signal definitions (lib/domain)', () => {
  it('carries the documented names — not the drifted ones', () => {
    expect(SIGNAL_DEFINITIONS.PSS.name).toBe('Patient Safety Signal')
    expect(SIGNAL_DEFINITIONS.PES.name).toBe('Patient Experience Signal')
    expect(SIGNAL_DEFINITIONS.SSS.name).toBe('Staff Stress Signal')
    expect(SIGNAL_DEFINITIONS.EIC.name).toBe('Ethics Intervention Count')
    expect(SIGNAL_DEFINITIONS.STI.name).toBe('System Throughput Index')
  })

  it('models EIC as a count and the other four as scores', () => {
    expect(SIGNAL_DEFINITIONS.EIC.kind).toBe('count')
    expect(SIGNAL_DEFINITIONS.PSS.kind).toBe('score')
    expect(SIGNAL_DEFINITIONS.PES.kind).toBe('score')
    expect(SIGNAL_DEFINITIONS.SSS.kind).toBe('score')
    expect(SIGNAL_DEFINITIONS.STI.kind).toBe('score')
  })
})
