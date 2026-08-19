/**
 * Server-side simulation_runs access attributed to the OTP user id.
 * Uses the service role so RLS does not require a Supabase Auth session.
 * Owner id comes from the OTP session → run owner module, not supabase.auth.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isResultsPayload, toSavedRun } from '@/lib/domain/saved-run'
import { supabaseServiceConfig } from './access-lookup'
import { type RunRecord } from '@/lib/supabase'

/** Identity helpers: session → owner id. History may keep importing `userIdFromOtpCookie`. */
export { runOwnerFromRequest, userIdFromOtpCookie } from './run-identity'
export type { RunOwnerRequest } from './run-identity'

function serviceClient(): SupabaseClient | null {
  const cfg = supabaseServiceConfig()
  if (!cfg) return null
  return createClient(cfg.url, cfg.key, { auth: { persistSession: false } })
}

export async function persistAttributedRun(record: RunRecord): Promise<string | null> {
  if (!record.user_id) return null
  if (!isResultsPayload(record.run_data)) return null
  const saved = toSavedRun(record.run_data)
  const row: RunRecord = { ...record, run_data: saved }
  const sb = serviceClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('simulation_runs')
    .insert([{
      user_id:          row.user_id,
      scenario_id:      row.scenario_id ?? null,
      run_data:         row.run_data,
      governance_state: row.governance_state ?? null,
      five_signals:     row.five_signals ?? null,
      run_metadata:     row.run_metadata ?? null,
    }])
    .select('id')
    .single()

  if (error) {
    console.error('[runs-db] persist error:', error.message)
    return null
  }
  return data?.id ?? null
}

export async function listRunsForUserId(userId: string, limit = 20): Promise<RunRecord[]> {
  const sb = serviceClient()
  if (!sb || !userId) return []

  const { data, error } = await sb
    .from('simulation_runs')
    .select('id, scenario_id, five_signals, run_metadata, created_at')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[runs-db] list error:', error.message)
    return []
  }
  return (data ?? []) as RunRecord[]
}

export async function fetchRunForUserId(runId: string, userId: string): Promise<RunRecord | null> {
  const sb = serviceClient()
  if (!sb || !runId || !userId) return null

  const { data, error } = await sb
    .from('simulation_runs')
    .select('id, user_id, scenario_id, run_data, five_signals, run_metadata, created_at')
    .eq('id', runId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .single()

  if (error) {
    console.error('[runs-db] fetch error:', error.message)
    return null
  }
  return data as RunRecord
}
