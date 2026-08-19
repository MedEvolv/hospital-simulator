/**
 * Saved-run overlay: persist -> list -> reopen -> results shape.
 *
 * Does not hit live Supabase. persist/list/fetch share an in-memory stand-in.
 * Does not print emails or secrets.
 */

jest.mock('@/lib/supabase', () => ({
  persistRun: jest.fn(),
}))

jest.mock('@/lib/auth/access-lookup', () => {
  const actual = jest.requireActual('@/lib/auth/access-lookup') as Record<string, unknown>
  return {
    ...actual,
    supabaseServiceConfig: jest.fn(() => null),
  }
})

jest.mock('@/lib/auth/runs-db', () => {
  const actual = jest.requireActual('@/lib/auth/runs-db') as typeof import('@/lib/auth/runs-db')
  return {
    ...actual,
    fetchRunForUserId: jest.fn(),
    listRunsForUserId: jest.fn(),
  }
})

import { readFileSync } from 'fs'
import { join } from 'path'
import { NextRequest } from 'next/server'
import { persistRun, type RunRecord } from '@/lib/supabase'
import {
  fetchRunForUserId,
  listRunsForUserId,
  persistAttributedRun,
} from '@/lib/auth/runs-db'
import { otpUserIdFromEmail } from '@/lib/auth/run-identity'
import { createSessionToken } from '@/lib/auth/session'
import { GET as historyList } from '@/app/api/history/route'
import { GET as historyOne } from '@/app/api/history/[id]/route'
import {
  SAVED_EVENT_CAP,
  fromSavedRun,
  isResultsPayload,
  toSavedRun,
  type ResultsReport,
} from '@/lib/domain/saved-run'

const SECRET = 'test-otp-session-secret-32chars-min'
const EMAIL = 'approved@lab.in'

const persistRunMock = persistRun as jest.MockedFunction<typeof persistRun>
const fetchRunMock = fetchRunForUserId as jest.MockedFunction<typeof fetchRunForUserId>
const listRunsMock = listRunsForUserId as jest.MockedFunction<typeof listRunsForUserId>

function makeReport(over: Partial<ResultsReport> = {}): ResultsReport {
  const report: ResultsReport = {
    run_id: 'run-live-1',
    institutional_profile: 'Balanced',
    timestamp: '2026-08-16T18:00:00.000Z',
    seed: 42,
    performance_scores: {
      patient_safety_score: 70,
      patient_experience_score: 65,
      staff_stress_score: 40,
      ethics_intervention_count: 2,
      system_throughput_index: 55,
      interpretation: 'Five signals held. No composite grade.',
    },
    moral_reckoning: {
      declared_values: { dignity: 0.9, fairness: 0.8 },
      value_drift: {
        maximum_drift: 0.1,
        average_drift: 0.05,
        primary_misalignment: 'fairness',
        interpretation: 'Small drift under load.',
        fairness_drift: 0.1,
      },
      ethical_debt: {
        current_debt: 12,
        interpretation: 'Contained.',
        category_breakdown: { unexplained_reorder: 12 },
      },
      tension_signals: { active: { active_count: 0, types: [] }, history: [] },
      harm_classifications: {
        summary: { total_harms_classified: 0, forced_count: 0, avoidable_count: 0 },
        details: [],
      },
      refusals: { summary: { total_refusals: 0 }, details: [] },
      unavoidable_harm_summary: {
        harms_that_occurred: [],
        values_not_honored: [],
        trade_offs_unresolved: [],
        summary: 'None recorded.',
      },
    },
    synthesis: {
      insights: [{ type: 'NOTE', severity: 'INFO', message: 'Signals stay separate.' }],
      recommendation: 'Keep the five signals distinct.',
      cost_accounting: {
        ethical_debt: 12,
        forced_harms: 0,
        avoidable_harms: 0,
        value_drift_average: 0.05,
        value_drift_maximum: 0.1,
        active_tensions: 0,
      },
      critical_question: 'Which pressure produced the drift?',
    },
    glp_optimal: { status: 'unavailable', reason: 'fixture', placeholder: 'not computed' },
    event_log: [{
      run_id: 'run-live-1',
      event_id: 'ev-1',
      timestamp: 0,
      sequence: 0,
      event_type: 'RUN_STARTED',
      payload: { seed: 42 },
    }],
    scenario_run: {
      scenario: {
        id: 'hallucinated-discharge-summary',
        name: 'The Hallucinated Discharge Summary',
        packId: 'automation-failure',
        durationTicks: 180,
      },
      run_id: 'run-live-1',
      seed: 42,
      timestamp: '2026-08-16T18:00:00.000Z',
      base_event_count: 1,
      injected_event_count: 0,
      five_signals: {
        PSS: { value: 70, delta: 0, explanation: 'fixture' },
        PES: { value: 65, delta: 0, explanation: 'fixture' },
        SSS: { value: 40, delta: 0, explanation: 'fixture' },
        EIC: { value: 2, delta: 0, explanation: 'fixture' },
        STI: { value: 55, delta: 0, explanation: 'fixture' },
      },
      governance_state: {
        human_state: {
          averageFatigue: 40,
          averageCognitiveLoad: 40,
          alertFatigue: 10,
          moraleScore: 70,
          escalationWillingness: 60,
          reviewCapacity: 60,
        },
      },
      governance_timeline: [],
      reflective_insights: [],
    },
    _disclaimer: 'This is a scenario-based governance simulation. It does not predict reality.',
  }
  return { ...report, ...over }
}

/** Same unguarded fields the results page reads after isResultsPayload. */
function assertResultsPageCanRead(report: ResultsReport): void {
  expect(report.performance_scores.interpretation.length).toBeGreaterThan(0)
  expect(typeof report.performance_scores.patient_safety_score).toBe('number')
  expect(report.synthesis.cost_accounting.ethical_debt.toFixed(0)).toBeDefined()
  expect(typeof report.synthesis.cost_accounting.forced_harms).toBe('number')
  expect(typeof report.synthesis.cost_accounting.avoidable_harms).toBe('number')
  expect(typeof report.synthesis.cost_accounting.value_drift_average).toBe('number')
  expect(typeof report.synthesis.cost_accounting.value_drift_maximum).toBe('number')
  expect(typeof report.synthesis.cost_accounting.active_tensions).toBe('number')
  expect(report.synthesis.insights.map((i) => i.message).join('')).toContain('Signals')
  expect(report.synthesis.recommendation.length).toBeGreaterThan(0)
  expect(report.synthesis.critical_question.length).toBeGreaterThan(0)
  expect(report.moral_reckoning.ethical_debt.current_debt.toFixed(0)).toBeDefined()
  expect(report.moral_reckoning.harm_classifications.summary.total_harms_classified).toBeDefined()
  expect(Array.isArray(report.moral_reckoning.refusals.details)).toBe(true)
  expect(Array.isArray(report.moral_reckoning.unavoidable_harm_summary.harms_that_occurred)).toBe(true)
  expect(typeof report.glp_optimal.status).toBe('string')
  expect(Array.isArray(report.event_log)).toBe(true)
  const sr = report.scenario_run as { scenario: { name: string; packId: string } } | undefined
  expect(sr?.scenario.name).toBe('The Hallucinated Discharge Summary')
  expect(sr?.scenario.packId).toBe('automation-failure')
}

function getRequest(url: string, cookie?: string): NextRequest {
  const headers = new Headers()
  if (cookie) headers.set('cookie', cookie)
  return new NextRequest(url, { method: 'GET', headers })
}

describe('saved-run domain', () => {
  it('rejects the old { events } persist shape', () => {
    expect(isResultsPayload({ events: [] })).toBe(false)
    expect(fromSavedRun({ events: [] })).toBeNull()
    expect(fromSavedRun({ run_data: { events: [] } })).toBeNull()
  })

  it('toSavedRun then fromSavedRun is the results payload', () => {
    const live = makeReport()
    const saved = toSavedRun(live)
    expect(saved.version).toBe(1)
    expect(isResultsPayload(saved)).toBe(true)
    const reopened = fromSavedRun(saved)
    expect(reopened).not.toBeNull()
    expect(isResultsPayload(reopened)).toBe(true)
    assertResultsPageCanRead(reopened!)
  })

  it('caps the stored event log', () => {
    const events = Array.from({ length: SAVED_EVENT_CAP + 5 }, (_, i) => ({
      run_id: 'run-live-1',
      event_id: `ev-${i}`,
      timestamp: i,
      sequence: i,
      event_type: 'TICK',
      payload: {},
    }))
    const saved = toSavedRun(makeReport({ event_log: events }))
    expect(saved.event_log).toHaveLength(SAVED_EVENT_CAP)
  })
})

describe('persist -> list -> reopen -> results', () => {
  const env = { ...process.env }
  const store = new Map<string, RunRecord>()

  beforeEach(() => {
    store.clear()
    process.env = { ...env, OTP_SESSION_SECRET: SECRET }
    persistRunMock.mockImplementation(async (record) => {
      const id = 'stored-run-1'
      store.set(id, { ...record, id, created_at: '2026-08-16T18:00:00.000Z' })
      return id
    })
    fetchRunMock.mockImplementation(async (id, userId) => {
      const row = store.get(id)
      if (!row || row.user_id !== userId) return null
      return row
    })
    listRunsMock.mockImplementation(async (userId) => {
      return [...store.values()]
        .filter((row) => row.user_id === userId)
        .map(({ run_data: _run_data, ...rest }) => rest as RunRecord)
    })
  })

  afterEach(() => {
    process.env = { ...env }
    jest.clearAllMocks()
  })

  it('refuses to persist { events } even when user_id is present', async () => {
    const userId = await otpUserIdFromEmail(EMAIL, SECRET)
    const id = await persistAttributedRun({
      user_id: userId,
      run_data: { events: [] },
    })
    expect(id).toBeNull()
    expect(persistRunMock).not.toHaveBeenCalled()
  })

  it('writes the reopen shape, lists without run_data, reopens { ok, report }, and results can read it', async () => {
    const userId = await otpUserIdFromEmail(EMAIL, SECRET)
    const live = makeReport()

    expect(await persistAttributedRun({
      user_id: userId,
      scenario_id: 'hallucinated-discharge-summary',
      run_data: live,
      five_signals: { PSS: { value: 70 } },
      run_metadata: { scenarioName: 'The Hallucinated Discharge Summary', seed: 42 },
    })).toBeNull()
    expect(persistRunMock).not.toHaveBeenCalled()

    store.set('stored-run-1', {
      id: 'stored-run-1',
      user_id: userId,
      scenario_id: 'hallucinated-discharge-summary',
      run_data: toSavedRun(live),
      five_signals: { PSS: { value: 70 } },
      run_metadata: { scenarioName: 'The Hallucinated Discharge Summary', seed: 42 },
      created_at: '2026-08-16T18:00:00.000Z',
    })
    const stored = store.get('stored-run-1')
    expect(stored).toBeDefined()
    expect(isResultsPayload(stored?.run_data)).toBe(true)
    expect((stored?.run_data as { version?: number }).version).toBe(1)
    expect((stored?.run_data as { events?: unknown }).events).toBeUndefined()

    const token = await createSessionToken(EMAIL, SECRET)
    const cookie = `im_otp_session=${token}`

    const listRes = await historyList(getRequest('http://localhost/api/history', cookie))
    expect(listRes.status).toBe(200)
    const listBody = await listRes.json() as { ok: boolean; runs: Array<{ id?: string; run_data?: unknown }> }
    expect(listBody.ok).toBe(true)
    expect(listBody.runs).toHaveLength(1)
    expect(listBody.runs[0].id).toBe('stored-run-1')
    expect(listBody.runs[0].run_data).toBeUndefined()

    const oneRes = await historyOne(
      getRequest('http://localhost/api/history/stored-run-1', cookie),
      { params: { id: 'stored-run-1' } },
    )
    expect(oneRes.status).toBe(200)
    const oneBody = await oneRes.json() as { ok?: boolean; report?: unknown; run_data?: unknown }
    expect(oneBody.ok).toBe(true)
    expect(oneBody.run_data).toBeUndefined()
    expect(oneBody.report).toBeDefined()

    const sessionReport = fromSavedRun(oneBody.report)
    expect(sessionReport).not.toBeNull()
    expect(isResultsPayload(sessionReport)).toBe(true)
    assertResultsPageCanRead(sessionReport!)
    expect(JSON.stringify(sessionReport)).not.toContain(EMAIL)
  })

  it('answers 422 incomplete_saved_run for leftover { events } rows', async () => {
    const userId = await otpUserIdFromEmail(EMAIL, SECRET)
    store.set('old-events-row', {
      id: 'old-events-row',
      user_id: userId,
      run_data: { events: [] },
    })
    const token = await createSessionToken(EMAIL, SECRET)
    const res = await historyOne(
      getRequest('http://localhost/api/history/old-events-row', `im_otp_session=${token}`),
      { params: { id: 'old-events-row' } },
    )
    expect(res.status).toBe(422)
    const body = await res.json() as { ok: boolean; error: string; report?: unknown; run_data?: unknown }
    expect(body.ok).toBe(false)
    expect(body.error).toBe('incomplete_saved_run')
    expect(body.report).toBeUndefined()
    expect(body.run_data).toBeUndefined()
  })
})

describe('source guards: results gate and history contract', () => {
  const root = join(__dirname, '../..')

  it('results page redirects unless isResultsPayload', () => {
    const src = readFileSync(join(root, 'app/results/page.tsx'), 'utf8')
    expect(src).toMatch(/isResultsPayload\(parsed\)/)
    expect(src).toMatch(/router\.replace\('\/history'\)/)
  })
})
