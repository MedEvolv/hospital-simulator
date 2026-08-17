/**
 * Mirror cites named HGR instruments from the vendored pack.
 * Axis A/B never enter GLP, STI, or the citation payload.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  citationPack,
  pairForScenario,
  payloadHasAxisScores,
  advise,
} from '@/lib/governance-pair'
import { computeFiveSignals } from '@/lib/scenarios/runner'
import { getScenarioById } from '@/lib/scenarios/registry'
import type { PerformanceScores } from '@/lib/types'

const ROOT = join(__dirname, '../..')

describe('run path cites HGR instruments from the pack', () => {
  it('citation pack has id/title/layer/one-line force/claim_type and no axis scores', () => {
    const pack = citationPack()
    expect(pack.instruments.length).toBe(22)
    expect((pack as { edges?: unknown }).edges).toBeUndefined()
    const dpdp = pack.instruments.find((row) => row.id === 'IND-LAW-DPDP-001')
    expect(dpdp?.title).toMatch(/Digital Personal Data Protection Act/)
    expect(dpdp?.layer).toEqual([1])
    expect(dpdp?.one_line_force).toMatch(/Binding statute/)
    expect(dpdp?.claim_type).toBe('INFERENCE')
    expect(JSON.stringify(pack)).not.toMatch(/regulatory_significance/)
    expect(JSON.stringify(pack)).not.toMatch(/trajectory_significance/)
    expect(JSON.stringify(pack)).not.toMatch(/mandatory:\s*false/)
    const nhrp = pack.instruments.find((row) => row.id === 'IND-POL-NHRP-001')
    expect(nhrp?.claim_type).toBe('UNKNOWN')
    expect(nhrp?.one_line_force).toMatch(/draft SHALL/)
    expect(nhrp?.one_line_force).not.toMatch(/funded centre that is operating/)
    const bodh = pack.instruments.find((row) => row.id === 'IND-INF-BODH-001')
    expect(bodh?.claim_type).toBe('UNKNOWN')
    expect(bodh?.one_line_force).toMatch(/PIB is not gazette/)
    const disha = pack.instruments.find((row) => row.id === 'IND-LAW-DISHA-000')
    expect(disha?.claim_type).toBe('UNKNOWN')
    expect(disha?.pair_key).toBeUndefined()
  })

  it('pairForScenario on a live scenario attaches at least one pack citation', () => {
    const scenario = getScenarioById('ai-triage-drift-er-overload')
    expect(scenario).toBeDefined()
    const pair = pairForScenario(scenario!)
    expect(pair.advisor.citations.length).toBeGreaterThan(0)
    const ids = pair.advisor.citations.map((row) => row.id)
    expect(ids.some((id) => id.startsWith('IND-'))).toBe(true)
    const packIds = new Set(citationPack().instruments.map((row) => row.id))
    expect(ids.every((id) => packIds.has(id))).toBe(true)
    expect(pair.advisor.citations.some((row) => row.id === 'IND-LAW-DPDP-001' || row.id === 'IND-POL-SAHI-001')).toBe(true)
  })

  it('a situation naming DPDP/MDR/ABDM/NABH attaches those four citations', () => {
    const advice = advise('Hospital asks whether DPDP, MDR, ABDM, and NABH apply to this AI note.')
    const ids = advice.citations.map((row) => row.id)
    expect(ids).toContain('IND-LAW-DPDP-001')
    expect(ids).toContain('IND-LAW-CDSCO-MDR-001')
    expect(ids).toContain('IND-INF-ABDM-001')
    expect(ids).toContain('IND-STD-NABH-DH-001')
    expect(JSON.stringify(advice)).not.toContain('regulatory_significance')
  })

  it('run-scenario stores the pair that now carries citations', () => {
    const src = readFileSync(join(ROOT, 'app/api/run-scenario/route.ts'), 'utf8')
    expect(src).toMatch(/governance_pair:\s*pairForScenario\(scenario\)/)
    expect(src).not.toMatch(/regulatory_significance/)
    expect(src).not.toMatch(/trajectory_significance/)
  })
})

describe('GLP/STI payload never carries axis scores', () => {
  it('pair JSON has no regulatory_significance or axis keys', () => {
    const scenario = getScenarioById('hallucinated-discharge-summary')
    const pair = pairForScenario(scenario!)
    const blob = JSON.stringify(pair)
    expect(payloadHasAxisScores(pair)).toBe(false)
    expect(blob).not.toContain('regulatory_significance')
    expect(blob).not.toContain('trajectory_significance')
    expect(blob).not.toContain('axis_a')
    expect(blob).not.toContain('objective_value')
  })

  it('STI mapping ignores stuffed axis ordinals and does not echo them', () => {
    const scores = {
      patient_safety_score: 61,
      patient_experience_score: 55,
      staff_stress_score: 38,
      ethics_intervention_count: 7,
      system_throughput_index: 72,
      interpretation: 'fixture',
      regulatory_significance: 4,
      trajectory_significance: 3,
      axis_a: 4,
      axis_b: 2,
    } as unknown as PerformanceScores
    const signals = computeFiveSignals(scores)
    expect(signals.STI.value).toBe(72)
    const blob = JSON.stringify(signals)
    expect(blob).not.toContain('regulatory_significance')
    expect(blob).not.toContain('trajectory_significance')
    expect(blob).not.toContain('axis_a')
    expect(payloadHasAxisScores(signals)).toBe(false)
  })

  it('GLP goal builder source allowlists only PSS/PES/SSS/STI', () => {
    const src = readFileSync(join(ROOT, 'api/run_simulation.py'), 'utf8')
    const build = src.split('def _build_glp_goal_specs')[1].split('def _hgr_axes_present_in_scores')[0]
    expect(build).toContain('"PSS"')
    expect(build).toContain('"STI"')
    expect(build).toContain('system_throughput_index')
    expect(build).not.toContain('regulatory_significance')
    expect(build).not.toContain('trajectory_significance')
    expect(build).not.toContain('axis_a')
    expect(src).toContain('regulatory_significance')
    expect(src).toMatch(/FORBIDDEN_GLP_GOAL_PROXIES[\s\S]*regulatory_significance/)
  })
})
