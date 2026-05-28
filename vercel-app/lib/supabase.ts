/**
 * Supabase client — v2 Phase 8
 *
 * Browser client for client components.
 * Server-side operations (API routes) should use the same client;
 * for service-role bypass, supply SUPABASE_SERVICE_ROLE_KEY env var separately.
 *
 * RLS is always active. The anon key is the correct key for client operations.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Persistence features will be disabled. Add them to .env.local.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ── Persistence helpers ───────────────────────────────────────────────────────

export interface RunRecord {
  id?: string
  user_id?: string | null
  scenario_id?: string | null
  run_data: object
  governance_state?: object | null
  five_signals?: object | null
  run_metadata?: object | null
  created_at?: string
  is_deleted?: boolean
}

/**
 * Persist a completed simulation run to Supabase.
 * Returns the inserted row id, or null if persistence is disabled / fails.
 *
 * This is best-effort — callers should not fail if this returns null.
 */
export async function persistRun(record: RunRecord): Promise<string | null> {
  if (!supabaseUrl) return null

  try {
    const { data, error } = await supabase
      .from('simulation_runs')
      .insert([{
        user_id:          record.user_id ?? null,
        scenario_id:      record.scenario_id ?? null,
        run_data:         record.run_data,
        governance_state: record.governance_state ?? null,
        five_signals:     record.five_signals ?? null,
        run_metadata:     record.run_metadata ?? null,
      }])
      .select('id')
      .single()

    if (error) {
      console.error('[supabase] persistRun error:', error.message)
      return null
    }

    return data?.id ?? null
  } catch (e) {
    console.error('[supabase] persistRun exception:', e)
    return null
  }
}

/**
 * Append governance events for a run.
 * Wraps the immutable append-only governance_events table.
 * No-op if persistence is disabled.
 */
export async function appendGovernanceEvents(
  runId: string,
  events: Array<{ event_type: string; payload: object; sequence_number: number }>
): Promise<void> {
  if (!supabaseUrl || !runId || events.length === 0) return

  try {
    const rows = events.map(ev => ({
      run_id:          runId,
      event_type:      ev.event_type,
      payload:         ev.payload,
      sequence_number: ev.sequence_number,
    }))

    const { error } = await supabase
      .from('governance_events')
      .insert(rows)

    if (error) {
      console.error('[supabase] appendGovernanceEvents error:', error.message)
    }
  } catch (e) {
    console.error('[supabase] appendGovernanceEvents exception:', e)
  }
}

/**
 * Fetch all non-deleted runs for the current user, most recent first.
 * Returns empty array if unauthenticated or persistence disabled.
 */
export async function fetchUserRuns(limit = 20): Promise<RunRecord[]> {
  if (!supabaseUrl) return []

  try {
    const { data, error } = await supabase
      .from('simulation_runs')
      .select('id, scenario_id, five_signals, run_metadata, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[supabase] fetchUserRuns error:', error.message)
      return []
    }

    return (data ?? []) as RunRecord[]
  } catch (e) {
    console.error('[supabase] fetchUserRuns exception:', e)
    return []
  }
}

/**
 * Fetch a single run by id (only if owned by current user).
 */
export async function fetchRun(runId: string): Promise<RunRecord | null> {
  if (!supabaseUrl) return null

  try {
    const { data, error } = await supabase
      .from('simulation_runs')
      .select('*')
      .eq('id', runId)
      .eq('is_deleted', false)
      .single()

    if (error) {
      console.error('[supabase] fetchRun error:', error.message)
      return null
    }

    return data as RunRecord
  } catch (e) {
    console.error('[supabase] fetchRun exception:', e)
    return null
  }
}

/**
 * Soft-delete a run (sets is_deleted = true).
 * Hard delete is prohibited by architecture.
 */
export async function softDeleteRun(runId: string): Promise<boolean> {
  if (!supabaseUrl) return false

  try {
    const { error } = await supabase
      .from('simulation_runs')
      .update({ is_deleted: true })
      .eq('id', runId)

    if (error) {
      console.error('[supabase] softDeleteRun error:', error.message)
      return false
    }

    return true
  } catch (e) {
    console.error('[supabase] softDeleteRun exception:', e)
    return false
  }
}
