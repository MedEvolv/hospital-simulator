/**
 * Honesty labels for the live HRM pair (Advisor then Auditor).
 * Mirrors the Python suite in healthcare-ai-curriculum/test_honesty_labels.py.
 * Does not invent NHRP centres, a BODH mandate, or DPDP s.8 as human review.
 */

import { advise, analyze, audit, pairForScenario } from '@/lib/governance-pair'
import { getScenarioById } from '@/lib/scenarios/registry'

const A1 =
  'A tier-2 hospital in Maharashtra deploys an LLM that screens chest X-rays ' +
  'for TB and suggests referrals. It was validated on a Delhi dataset.'
const EKA_ONLY =
  'A vendor proposes using the Eka Care BODHI-S dataset ' +
  '(condition-symptom-speciality graph) as the hospital knowledge layer.'
const BOTH_NAMED = 'Should we submit the tool to BODH or use Eka Care BODHI-S instead?'
const LIE = 'schedule it (NHRP 4.6.4 / BODH)'

describe('HRM pair honesty labels', () => {
  it('A1 plan is honest, audited, Monday-last, and still selects NHRP and BODH', () => {
    const pair = analyze(A1)
    const advisor = pair.advisor
    const planText = advisor.plan.join(' ')
    const keys = advisor.instrument_keys

    expect(planText).not.toContain(LIE)
    const honest =
      planText.includes('draft SHALL')
      || planText.toLowerCase().includes('voluntary')
      || planText.includes('not Eka')
      || planText.includes('BODHI')
    expect(honest).toBe(true)
    expect(advisor.plan[advisor.plan.length - 1].startsWith('Land at Monday')).toBe(true)
    expect(advisor.audited).toBe(true)
    expect(keys).toContain('instrument--nhrp-2026')
    expect(keys).toContain('instrument--bodh-2026')
    expect(JSON.stringify(pair)).not.toMatch(/mandatory:\s*false/)
    expect(JSON.stringify(pair)).not.toMatch(/funded centre that is operating/)
    expect(JSON.stringify(pair)).not.toContain('objective_value')
    expect(JSON.stringify(pair)).not.toContain('axis_a')
    expect(JSON.stringify(pair)).not.toContain('regulatory_significance')
    expect(JSON.stringify(pair)).not.toContain('trajectory_significance')
  })

  it('Eka BODHI-S without the word BODH does not select MoHFW BODH', () => {
    expect(advise(EKA_ONLY).instrument_keys).not.toContain('instrument--bodh-2026')
  })

  it('naming BODH and BODHI-S together may include BODH', () => {
    expect(advise(BOTH_NAMED).instrument_keys).toContain('instrument--bodh-2026')
  })

  it('Auditor publish is T2 and patient-data access is T3', () => {
    expect(audit('publish the Four Gaps publicly').tier).toBe('T2')
    expect(audit('access patient data from a partner hospital').tier).toBe('T3')
  })

  it('patient-data checklist cites NABL 7.3, not DPDP Section 8 as human review', () => {
    const checked = audit('access patient data from a partner hospital')
    const text = checked.checklist.join(' ')
    expect(text).toContain('NABL ISO 15189:2022 clause 7.3')
    expect(text).toContain('not DPDP Section 8')
    expect(text).not.toMatch(/GDPR Article 22/)
  })
})

describe('scenario situation still keeps honesty labels', () => {
  it('triage scenario pair is audited and does not schedule a national NHRP/BODH centre', () => {
    const scenario = getScenarioById('ai-triage-drift-er-overload')
    expect(scenario).toBeDefined()
    const pair = pairForScenario(scenario!)
    expect(pair.advisor.audited).toBe(true)
    const planText = pair.advisor.plan.join(' ')
    expect(planText).not.toContain(LIE)
    expect(pair.advisor.plan[pair.advisor.plan.length - 1].startsWith('Land at Monday')).toBe(true)
    expect(JSON.stringify(pair)).not.toMatch(/PIB is gazette/)
  })
})
