/**
 * POST /api/run-scenario
 *
 * Orchestrates a full v2 scenario run:
 *   1. Validates the requested scenario ID
 *   2. Calls the Python simulation backend (/api/run_simulation)
 *   3. Injects scenario stressor events at specified ticks
 *   4. Replays governance engines over the augmented event log
 *   5. Computes Five Signal Metrics + reflective insights
 *   6. Persists to Supabase (if configured)
 *   7. Returns the ScenarioRunResult enriched on the SimulationReport shape
 *
 * Body: { scenarioId: string }
 * Response: SimulationReport + { scenario_run: ScenarioRunResult }
 *
 * The response is backward-compatible with the existing results page
 * (which reads SimulationReport from sessionStorage) and also carries
 * the full v2 governance state for the new Command Center UI.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/config'
import { persistAttributedRun } from '@/lib/auth/runs-db'
import { assertUserIdWhenSession, userIdFromOtpCookie } from '@/lib/auth/run-identity'
import { readSessionToken } from '@/lib/auth/session'
import { toSavedRun } from '@/lib/domain/saved-run'
import { getScenarioById } from '@/lib/scenarios/registry'
import { runScenario } from '@/lib/scenarios/runner'
import { appendGovernanceEvents } from '@/lib/supabase'
import type { SimulationReport } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve the base URL for internal API calls.
 *
 * Priority:
 *   1. NEXT_PUBLIC_BASE_URL — explicit override (useful for custom domains)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — stable production domain set by Vercel
 *      (e.g. sandbox-v2.archlife.in). Unlike VERCEL_URL, this is the public
 *      custom domain and is NOT behind Vercel deployment-protection auth.
 *   3. VERCEL_URL — deployment-scoped subdomain (may be auth-gated on preview)
 *   4. localhost:3000 — local dev fallback
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

/**
 * Call the Python simulation backend and return the SimulationReport.
 * Reuses the exact same request shape as the existing /api/run_simulation endpoint.
 */
async function callPythonSimulation(
  simulationProfile: string,
  durationTicks: number,
  seed: number,
): Promise<SimulationReport> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/api/run_simulation`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)

  // Pass the Vercel protection-bypass secret so server-to-server calls
  // aren't blocked when Deployment Protection is enabled on the project.
  const bypassHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    bypassHeaders['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: bypassHeaders,
      body: JSON.stringify({
        profile: simulationProfile,
        duration_ticks: durationTicks,
        seed,
        patients_per_hour: 8,
        er_capacity: 2,
        opd_capacity: 4,
      }),
      signal: controller.signal,
    })
  } catch (e) {
    const msg = (e instanceof Error && e.name === 'AbortError')
      ? 'Python simulation timed out after 25 s'
      : `Python simulation unreachable: ${e instanceof Error ? e.message : String(e)}`
    throw new Error(msg)
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Python simulation failed (${res.status}): ${text.slice(0, 300)}`)
  }

  return res.json() as Promise<SimulationReport>
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { scenarioId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const { scenarioId } = body
  if (!scenarioId || typeof scenarioId !== 'string') {
    return NextResponse.json(
      { error: 'scenarioId is required' },
      { status: 400 },
    )
  }

  // ── Validate scenario ──────────────────────────────────────────────────────
  const scenario = getScenarioById(scenarioId)
  if (!scenario) {
    const { getAllScenarios: list } = await import('@/lib/scenarios/registry')
    return NextResponse.json(
      {
        error: `Scenario '${scenarioId}' not found`,
        available: list().map(s => s.id),
      },
      { status: 404 },
    )
  }

  // ── Run simulation ─────────────────────────────────────────────────────────
  let baseReport: SimulationReport
  try {
    baseReport = await callPythonSimulation(
      scenario.simulationProfile,
      scenario.durationTicks,
      scenario.seed,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[run-scenario] Python simulation error:', message)
    return NextResponse.json(
      { error: `Simulation backend error: ${message}` },
      { status: 502 },
    )
  }

  // ── Orchestrate scenario (inject stressors + governance replay) ────────────
  let scenarioResult
  try {
    scenarioResult = await runScenario(scenario, baseReport)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[run-scenario] Governance runner error:', message)
    return NextResponse.json(
      { error: `Governance runner error: ${message}` },
      { status: 500 },
    )
  }

  // Compose the live report first. Persist stores that same object (trimmed
  // event log) so reopen lands on the shape the results page already reads.
  const response = {
    ...baseReport,
    event_log: scenarioResult.events,
    scenario_run: {
      scenario: scenarioResult.scenario,
      run_id: scenarioResult.runId,
      seed: scenarioResult.seed,
      timestamp: scenarioResult.timestamp,
      base_event_count: scenarioResult.baseEventCount,
      injected_event_count: scenarioResult.injectedEventCount,
      governance_state: {
        trust: scenarioResult.governanceState.trust,
        hidden_strain: scenarioResult.governanceState.hiddenStrain,
        ethical_debt: scenarioResult.governanceState.ethicalDebt,
        governance_drift: scenarioResult.governanceState.governanceDrift,
        automation_drift: scenarioResult.governanceState.automationDrift,
        human_state: {
          averageFatigue: Math.round(scenarioResult.governanceState.humanState.fatigue),
          averageCognitiveLoad: Math.round(scenarioResult.governanceState.humanState.cognitiveLoad),
          alertFatigue: Math.round(scenarioResult.governanceState.humanState.alertFatigue),
          moraleScore: Math.round(100 - scenarioResult.governanceState.humanState.burnout),
          escalationWillingness: Math.round(scenarioResult.governanceState.humanState.escalationWillingness),
          reviewCapacity: Math.round(scenarioResult.governanceState.humanState.reviewCapacity),
        },
      },
      five_signals: scenarioResult.fiveSignals,
      governance_timeline: scenarioResult.governanceTimeline,
      reflective_insights: scenarioResult.reflectiveInsights,
    },
    _disclaimer: 'This is a scenario-based governance simulation. It does not predict reality.',
  }

  let persistedRunId: string | null = null
  try {
    const otpCookie = req.cookies.get(SESSION_COOKIE)?.value
    const session = await readSessionToken(otpCookie)
    const userId = await userIdFromOtpCookie(otpCookie)
    assertUserIdWhenSession(Boolean(session), userId)

    if (userId) {
      persistedRunId = await persistAttributedRun({
        user_id:          userId,
        scenario_id:      scenarioResult.scenario.id,
        run_data:         toSavedRun(response),
        governance_state: {
          trust:            scenarioResult.governanceState.trust,
          hidden_strain:    scenarioResult.governanceState.hiddenStrain,
          ethical_debt:     scenarioResult.governanceState.ethicalDebt,
          governance_drift: scenarioResult.governanceState.governanceDrift,
        },
        five_signals: scenarioResult.fiveSignals as unknown as object,
        run_metadata: {
          runId:           scenarioResult.runId,
          seed:            scenarioResult.seed,
          timestamp:       scenarioResult.timestamp,
          scenarioName:    scenarioResult.scenario.name,
          durationTicks:   scenarioResult.scenario.durationTicks,
          baseEventCount:  scenarioResult.baseEventCount,
          injectedCount:   scenarioResult.injectedEventCount,
        },
      })

      if (persistedRunId) {
        await appendGovernanceEvents(persistedRunId, [
          {
            event_type:      'SCENARIO_RUN_COMPLETED',
            sequence_number: 0,
            payload: {
              scenario_id:   scenarioResult.scenario.id,
              run_id:        scenarioResult.runId,
              seed:          scenarioResult.seed,
              event_count:   scenarioResult.events.length,
              injected_count: scenarioResult.injectedEventCount,
            },
          },
        ])
      }
    }
  } catch (persistErr) {
    console.error('[run-scenario] Supabase persistence error:', persistErr)
  }

  return NextResponse.json({
    ...response,
    _db_run_id: persistedRunId,
  })
}

// ── GET: list available scenarios ─────────────────────────────────────────────

export async function GET() {
  const { getAllScenarios } = await import('@/lib/scenarios/registry')
  const scenarios = getAllScenarios().map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    packId: s.packId,
    expectedRiskPathways: s.expectedRiskPathways,
    learningObjectives: s.learningObjectives,
    simulationProfile: s.simulationProfile,
    durationTicks: s.durationTicks,
    stressorCount: s.stressors.length,
  }))

  return NextResponse.json({
    scenarios,
    total: scenarios.length,
    _disclaimer: 'This is a scenario-based governance simulation. It does not predict reality.',
  })
}
