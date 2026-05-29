/**
 * POST /api/feedback
 *
 * Persists expert feedback to Supabase by patching the
 * run_metadata JSONB column on an existing simulation_runs row.
 *
 * Uses the service-role key so it can write regardless of RLS policies
 * (the anon key only allows writes when the user owns the row).
 *
 * Body:
 *   { runId: string, feedback: ExpertFeedback }
 *
 * Response:
 *   200 { ok: true }
 *   400 { error: string }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  let body: { runId?: string; feedback?: Record<string, unknown> }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { runId, feedback } = body

  if (!runId || !feedback) {
    return NextResponse.json({ error: 'runId and feedback are required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    // No DB credentials — silently accept (feedback was already saved client-side)
    return NextResponse.json({ ok: true, persisted: false })
  }

  // Fetch the existing run_metadata so we can merge (not overwrite)
  const { data: existing } = await supabase
    .from('simulation_runs')
    .select('run_metadata')
    .eq('id', runId)
    .single()

  const currentMeta = (existing?.run_metadata ?? {}) as Record<string, unknown>

  const { error } = await supabase
    .from('simulation_runs')
    .update({
      run_metadata: {
        ...currentMeta,
        expert_feedback: {
          ...feedback,
          savedAt: new Date().toISOString(),
        },
      },
    })
    .eq('id', runId)

  if (error) {
    console.error('[feedback] Supabase update error:', error.message)
    // Don't 500 — feedback was already saved client-side in sessionStorage
    return NextResponse.json({ ok: true, persisted: false, detail: error.message })
  }

  return NextResponse.json({ ok: true, persisted: true })
}
