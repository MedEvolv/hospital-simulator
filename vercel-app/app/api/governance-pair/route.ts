/**
 * POST /api/governance-pair
 *
 * Invokes the HRM pair (Advisor then Auditor) on a situation or scenario.
 * Knowledge layer only. No DeepSeek. Does not write Axis A/B into GLP/STI.
 *
 * Body: { situation: string } | { scenarioId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyze, pairForScenario } from '@/lib/governance-pair'
import { getScenarioById } from '@/lib/scenarios/registry'

export async function POST(req: NextRequest) {
  let body: { situation?: string; scenarioId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.scenarioId === 'string' && body.scenarioId.length > 0) {
    const scenario = getScenarioById(body.scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: `Scenario '${body.scenarioId}' not found` }, { status: 404 })
    }
    return NextResponse.json(pairForScenario(scenario))
  }

  if (typeof body.situation === 'string' && body.situation.trim().length > 0) {
    return NextResponse.json(analyze(body.situation.trim()))
  }

  return NextResponse.json(
    { error: 'situation or scenarioId is required' },
    { status: 400 },
  )
}
