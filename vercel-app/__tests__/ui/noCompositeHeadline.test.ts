/**
 * RULE-A1 — no sixth score in the UI.
 *
 * History and Scenario Studio used to average PSS/PES/SSS/EIC/STI into a
 * "composite" headline. GLP may keep a solver diagnostic `objective_value`
 * in JSON; GlpPanel must not render it as a grade.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const root = join(__dirname, '../..')

describe('RULE-A1: no composite headline', () => {
  it('history cards do not compute or label a composite', () => {
    const src = readFileSync(join(root, 'app/history/page.tsx'), 'utf8')
    expect(src).not.toMatch(/let composite/)
    expect(src).not.toMatch(/\(\(s\.PSS\?\.value/)
    expect(src).not.toMatch(/text-\[10px\] font-mono text-slate-500 mb-0\.5">composite/)
  })

  it('scenario sandbox does not average slots into a composite grade', () => {
    const src = readFileSync(join(root, 'components/ScenarioSandbox.tsx'), 'utf8')
    expect(src).not.toMatch(/function compositeScore/)
    expect(src).not.toMatch(/Composite \{/)
    expect(src).not.toMatch(/composite pts/)
  })

  it('GlpPanel shows d+/d− and does not render objective_value as a grade', () => {
    const src = readFileSync(join(root, 'app/results/page.tsx'), 'utf8')
    const start = src.indexOf('function GlpPanel')
    const end = src.indexOf('function GovernanceTimeline', start)
    const panel = src.slice(start, end)
    expect(panel).toContain('d_minus')
    expect(panel).toContain('d_plus')
    expect(panel).not.toMatch(/\{glp\.objective_value\}/)
  })
})
