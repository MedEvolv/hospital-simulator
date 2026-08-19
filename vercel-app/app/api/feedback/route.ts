/**
 * POST /api/feedback
 *
 * Persists expert feedback onto an existing simulation_runs row owned by
 * the OTP session. Service-role update is not world-writable.
 *
 * Body:
 *   { runId: string, feedback: ExpertFeedback }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseServiceConfig } from '@/lib/auth/access-lookup'
import { runOwnerFromRequest } from '@/lib/auth/run-identity'

function getServiceClient() {
  const cfg = supabaseServiceConfig()
  if (!cfg) return null
  return createClient(cfg.url, cfg.key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  const owner = await runOwnerFromRequest(req)
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('simulation_runs')
    .select('id, run_metadata')
    .eq('id', runId)
    .eq('user_id', owner)
    .maybeSingle()

  if (fetchError) {
    console.error('[feedback] Supabase fetch error:', fetchError.message)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const currentMeta = (existing.run_metadata ?? {}) as Record<string, unknown>

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
    .eq('user_id', owner)

  if (error) {
    console.error('[feedback] Supabase update error:', error.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, persisted: true })
}
