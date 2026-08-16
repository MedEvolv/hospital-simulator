/**
 * Optional alignment chips (2026-08-16): IndiaAI sutras, NHRP draft,
 * DPDP §13 grievance, eSanjeevani ecosystem. No new routes. No Eka BODHI.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const APP = join(__dirname, '../../app')

function readPage(rel: string): string {
  return readFileSync(join(APP, rel), 'utf8')
}

describe('alignment chips named 2026-08-16', () => {
  const sahi = readPage('sahi/page.tsx')
  const dpdp = readPage('dpdp/page.tsx')
  const abdm = readPage('abdm/page.tsx')

  it('prints official IndiaAI sutras on /sahi, not a HOTL paraphrase', () => {
    expect(sahi).toContain('Trust is the foundation')
    expect(sahi).toContain('People first')
    expect(sahi).toContain('Innovation over Restraint')
    expect(sahi).toContain('Understandable by design')
    expect(sahi).toContain('IndiaAI Governance Guidelines')
    expect(sahi).not.toMatch(/Human-Over-The-Loop|HOTL/)
    expect(sahi).not.toMatch(/BODHI-S|BODHI-M|eka\.care|Eka Care/)
  })

  it('labels NHRP as a DHR draft SHALL, not funded machinery', () => {
    expect(sahi).toContain('Draft National Health Research Policy 2026')
    expect(sahi).toContain('4.6.4.1')
    expect(sahi).toContain('not a funded centre')
    expect(sahi).toContain('No /nhrp route')
    expect(sahi).toContain('https://dhr.gov.in/static/uploads/2026/07/cd80b4d9af184586ae68364fc94849ad.pdf')
    expect(sahi).toContain('2296281 is not this')
  })

  it('names DPDP §13 grievance without becoming a complaint channel', () => {
    expect(dpdp).toContain('Section 13')
    expect(dpdp).toContain('grievance')
    expect(dpdp).toContain('processes no personal data')
  })

  it('treats eSanjeevani as an ecosystem surface, not a Mirror module', () => {
    expect(abdm).toContain('eSanjeevani')
    expect(abdm).toContain('https://esanjeevani.mohfw.gov.in/')
    expect(abdm).toContain('not a Mirror module')
    expect(abdm).toContain('structured capture is not a diagnosis')
    expect(abdm).not.toMatch(/282 million|VITA|Wadhwani|IIT/)
    expect(abdm).not.toMatch(/\u2014/)
  })
})
