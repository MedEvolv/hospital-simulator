/**
 * Product path: a scenario run must invoke the HRM pair, not only render a page.
 * Source guards plus a live call through the API wrapper.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest } from 'next/server'
import { POST as pairPost } from '@/app/api/governance-pair/route'
import { pairForScenario } from '@/lib/governance-pair'
import { getScenarioById } from '@/lib/scenarios/registry'

const ROOT = join(__dirname, '../..')

describe('product path invokes the HRM pair', () => {
  it('run-scenario calls pairForScenario and stores governance_pair', () => {
    const src = readFileSync(join(ROOT, 'app/api/run-scenario/route.ts'), 'utf8')
    expect(src).toMatch(/from '@\/lib\/governance-pair'/)
    expect(src).toMatch(/pairForScenario\(scenario\)/)
    expect(src).toMatch(/governance_pair:\s*pairForScenario\(scenario\)/)
    expect(src).not.toMatch(/DEEPSEEK_API_KEY/)
    expect(src).not.toMatch(/objective_value/)
    expect(src).not.toMatch(/system_throughput_index:.+pair/)
  })

  it('results page reads scenario_run.governance_pair, not a second explainer', () => {
    const src = readFileSync(join(ROOT, 'app/results/page.tsx'), 'utf8')
    expect(src).toMatch(/sr\?\.governance_pair/)
    expect(src).toMatch(/Advisor then Auditor/)
    expect(src).toMatch(/audited_steps/)
  })

  it('pair module has no DeepSeek client key path', () => {
    const src = readFileSync(join(ROOT, 'lib/governance-pair/pair.ts'), 'utf8')
    expect(src).not.toMatch(/DEEPSEEK/)
    expect(src).not.toMatch(/process\.env/)
    expect(src).toMatch(/pairForScenario/)
    expect(src).toMatch(/analyze\(/)
  })

  it('POST /api/governance-pair actually runs Advisor then Auditor', async () => {
    const req = new NextRequest('http://localhost/api/governance-pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situation:
          'A tier-2 hospital in Maharashtra deploys an LLM that screens chest X-rays ' +
          'for TB and suggests referrals. It was validated on a Delhi dataset.',
      }),
    })
    const res = await pairPost(req)
    expect(res.status).toBe(200)
    const body = await res.json() as {
      advisor: { audited: boolean; plan: string[]; instrument_keys: string[] }
      audited_steps: Array<{ tier: string }>
    }
    expect(body.advisor.audited).toBe(true)
    expect(body.audited_steps.length).toBe(body.advisor.plan.length)
    expect(body.advisor.plan[body.advisor.plan.length - 1].startsWith('Land at Monday')).toBe(true)
    expect(body.advisor.instrument_keys).toContain('instrument--nhrp-2026')
    expect(body.advisor.instrument_keys).toContain('instrument--bodh-2026')
  })

  it('POST /api/governance-pair with a scenarioId calls pairForScenario', async () => {
    const scenario = getScenarioById('hallucinated-discharge-summary')
    expect(scenario).toBeDefined()
    const expected = pairForScenario(scenario!)
    const req = new NextRequest('http://localhost/api/governance-pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'hallucinated-discharge-summary' }),
    })
    const res = await pairPost(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { advisor: { audited: boolean; situation: string } }
    expect(body.advisor.audited).toBe(true)
    expect(body.advisor.situation).toBe(expected.advisor.situation)
  })
})
