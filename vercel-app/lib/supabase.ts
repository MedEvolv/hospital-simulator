/**
 * Supabase client — v2 Phase 8
 *
 * Browser client for client components.
 * Server-side operations (API routes) should use the same client;
 * for service-role bypass, supply SUPABASE_SERVICE_ROLE_KEY env var separately.
 *
 * The anon-key client is used for public/client operations.
 * Access control depends on the deployed database policies.
 * This repository does not by itself prove deployed RLS or immutability enforcement.
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
  if (!supabaseUrl || !supabaseAnon) return null

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
 * Append governance events for a persisted run. Database-level append-only or immutability enforcement depends on the deployed schema and policies; this helper only performs inserts.
 */
export async function appendGovernanceEvents(
  runId: string,
  events: Array<{ event_type: string; payload: object; sequence_number: number }>
): Promise<void> {
  if (!supabaseUrl || !supabaseAnon || !runId || events.length === 0) return

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
  if (!supabaseUrl || !supabaseAnon) return []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('simulation_runs')
      .select('id, scenario_id, five_signals, run_metadata, created_at')
      .eq('user_id', user.id)
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
  if (!supabaseUrl || !supabaseAnon) return null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('simulation_runs')
      .select('*')
      .eq('id', runId)
      .eq('user_id', user.id)
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
 * Soft-archive an authenticated user's run by setting is_deleted = true. This helper does not establish that hard deletion is prohibited at the database level.
 */
export async function softDeleteRun(runId: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnon) return false

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('simulation_runs')
      .update({ is_deleted: true })
      .eq('id', runId)
      .eq('user_id', user.id)

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
