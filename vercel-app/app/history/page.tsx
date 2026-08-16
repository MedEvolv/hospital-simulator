'use client'

/**
 * /history — Run History
 *
 * Lists the current user's previous simulation runs from Supabase.
 * Runs are loaded client-side via the Supabase anon client.
 * Authenticated users can see only runs attributed to their user ID.
 * Anonymous runs are not queried.
 * Persistence is best-effort and may be unavailable.
 *
 * Each run card links back to results by re-hydrating sessionStorage
 * from the run_data and redirecting to /results.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, type RunRecord } from '@/lib/supabase'
import { SESSION_KEY } from '@/lib/types'
import AssumptionsPanel from '@/components/AssumptionsPanel'

// ── Pack colour lookup ─────────────────────────────────────────────────────────

const PACK_BADGE: Record<string, string> = {
  'automation-failure':  'text-amber-400 border-amber-800/60 bg-amber-50/30',
  'institutional-strain':'text-orange-400 border-orange-800/60 bg-orange-950/30',
  'equity-participation':'text-sky-600 border-sky-200/60 bg-sky-50/30',
  'security-stress-test':'text-rose-400 border-rose-800/60 bg-rose-950/30',
}

const PACK_LABELS: Record<string, string> = {
  'automation-failure':  'Automation failure',
  'institutional-strain':'Institutional strain',
  'equity-participation':'Equity & participation',
  'security-stress-test':'Security stress test',
}

// ── Signal mini-bar ────────────────────────────────────────────────────────────

function SignalDots({ signals }: { signals: Record<string, { value: number }> | null }) {
  if (!signals) return <span className="text-[10px] text-slate-700">No signal data</span>

  const defs: Array<{ key: string; highMeansGood: boolean }> = [
    { key: 'PSS', highMeansGood: true },
    { key: 'PES', highMeansGood: true },
    { key: 'SSS', highMeansGood: false },
    { key: 'EIC', highMeansGood: true },
    { key: 'STI', highMeansGood: true },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {defs.map(({ key, highMeansGood }) => {
        const val = signals[key]?.value ?? 50
        const effective = highMeansGood ? val : (100 - val)
        const color = effective >= 70 ? 'bg-slate-300' : effective >= 40 ? 'bg-amber-500' : 'bg-red-500'
        return (
          <div key={key} className="flex flex-col items-center gap-0.5">
            <div className="w-6 bg-slate-100 rounded h-1.5 overflow-hidden">
              <div className={`h-full rounded ${color}`} style={{ width: `${val}%` }} />
            </div>
            <span className="text-[8px] font-mono text-slate-600">{key}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Run card ──────────────────────────────────────────────────────────────────

interface RunCardProps {
  run: RunRecord
  onReopen: (run: RunRecord) => void
  isReopening?: boolean
}

function RunCard({ run, onReopen, isReopening = false }: RunCardProps) {
  const meta = run.run_metadata as {
    scenarioName?: string
    durationTicks?: number
    baseEventCount?: number
    injectedCount?: number
    seed?: number
  } | null

  const scenarioId = run.scenario_id ?? ''
  const badge = PACK_BADGE[scenarioId] ?? 'text-slate-600 border-slate-300 bg-slate-100/30'
  const packLabel = PACK_LABELS[scenarioId] ?? scenarioId
  const scenarioName = meta?.scenarioName ?? scenarioId ?? 'Unknown scenario'
  const createdAt = run.created_at
    ? new Date(run.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

  const signals = run.five_signals as Record<string, { value: number }> | null

  // Composite score
  let composite: number | null = null
  if (signals) {
    const s = signals
    composite = Math.round(
      ((s.PSS?.value ?? 50) + (s.PES?.value ?? 50) + (100 - (s.SSS?.value ?? 50)) +
       (s.EIC?.value ?? 50) + (s.STI?.value ?? 50)) / 5
    )
  }

  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-white/20 hover:border-slate-300 hover:bg-white/40 transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-slate-800">{scenarioName}</h3>
          </div>
          <div className="flex items-center gap-2">
            {scenarioId && (
              <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded tracking-wider uppercase ${badge}`}>
                {packLabel}
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-600">{createdAt}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {composite !== null && (
            <div>
              <p className="text-[10px] font-mono text-slate-500 mb-0.5">composite</p>
              <p className={`text-xl font-mono ${
                composite >= 70 ? 'text-slate-700'
                  : composite >= 40 ? 'text-amber-400'
                  : 'text-red-400'
              }`}>{composite}</p>
            </div>
          )}
        </div>
      </div>

      {/* Signals */}
      <div className="mb-3">
        <SignalDots signals={signals} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600 mb-3">
        {meta?.durationTicks && <span>{meta.durationTicks} ticks</span>}
        {meta?.baseEventCount && <span>·</span>}
        {meta?.baseEventCount && <span>{meta.baseEventCount} events</span>}
        {meta?.injectedCount && <span>·</span>}
        {meta?.injectedCount && <span>{meta.injectedCount} injected</span>}
        {meta?.seed !== undefined && <span>·</span>}
        {meta?.seed !== undefined && <span>seed {meta.seed}</span>}
        {run.id && (
          <>
            <span>·</span>
            <span className="text-slate-700">{run.id.slice(-8)}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onReopen(run)}
          disabled={isReopening}
          className="flex-1 text-xs border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
        >
          {isReopening ? 'Loading…' : 'Re-open results →'}
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter()
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [reopening, setReopening] = useState<string | null>(null)   // run id being fetched
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Check auth state
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user.id ?? null
        setIsAuthenticated(!!userId)
        setCurrentUserId(userId)

        if (!userId) {
          setRuns([])
          setLoading(false)
          return
        }

        // Load recent runs — intentionally omits run_data (potentially large JSONB).
        // run_data is fetched lazily on "Re-open" to avoid loading 200-event blobs
        // for 20 rows simultaneously.
        const { data, error: dbError } = await supabase
          .from('simulation_runs')
          .select('id, scenario_id, five_signals, run_metadata, created_at')
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(20)

        if (dbError) throw new Error(dbError.message)

        setRuns((data ?? []) as RunRecord[])
      } catch (e) {
        setError('Run history is temporarily unavailable.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function reopenRun(run: RunRecord) {
    if (!currentUserId || !run.id) {
      setError('This saved run is not available to this session.')
      return
    }

    // Lazy-fetch run_data only when the user clicks "Re-open" — avoids loading
    // 200-event blobs for every visible row on mount.
    setReopening(run.id)
    try {
      const { data, error: dbError } = await supabase
        .from('simulation_runs')
        .select('run_data')
        .eq('id', run.id)
        .eq('user_id', currentUserId)
        .eq('is_deleted', false)
        .single()

      if (dbError || !data?.run_data) {
        setError('Could not load run data. The run may have been archived.')
        return
      }

      const storedData = data.run_data as { events?: unknown[]; [key: string]: unknown }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        ...storedData,
        run_id: run.id,
        _from_history: true,
        _disclaimer: 'This is a scenario-based governance simulation. It does not predict reality.',
      }))
      router.push('/results')
    } catch (e) {
      setError('Could not load this saved run right now.')
    } finally {
      setReopening(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">
              ← Home
            </Link>
            <span className="text-slate-800">|</span>
            <span className="text-xs font-mono text-slate-600 tracking-wider">Run History</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sandbox" className="text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">
              Scenario Studio
            </Link>
            <Link href="/export" className="text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">
              Export
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* ── Disclaimer ───────────────────────────────────────────────────── */}
        <div className="border border-slate-200 bg-white/40 rounded-lg px-4 py-2.5 mb-8 flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest shrink-0">Notice</span>
          <p className="text-xs text-slate-500">
            This is a scenario-based governance simulation. It does not predict reality.
          </p>
        </div>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
            Institutional Mirror v2 · Phase 8
          </p>
          <h1 className="text-2xl font-light text-slate-900 mb-2">Run History</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            When account-linked persistence is available, runs attributed to that account can be reopened here. A completed simulation does not guarantee that a history record was stored.
          </p>
        </div>

        {/* ── Auth notice ───────────────────────────────────────────────────── */}
        {!isAuthenticated && !loading && (
          <div className="border border-amber-200/40 bg-amber-50/20 rounded-lg px-5 py-4 mb-6">
            <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-1.5">
              Anonymous session
            </p>
            <p className="text-xs text-amber-300/70 leading-relaxed">
              Account-linked run history is not enabled in this public prototype. This page does not retrieve anonymous runs, and a simulation can still complete when no history record is stored.
            </p>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-slate-200 rounded-lg p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-48 mb-2" />
                <div className="h-3 bg-slate-100/60 rounded w-32 mb-3" />
                <div className="h-2 bg-slate-100/40 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="border border-red-900/50 bg-red-950/20 rounded-lg px-5 py-4 mb-6">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* ── No runs ───────────────────────────────────────────────────────── */}
        {!loading && !error && runs.length === 0 && (
          <div className="border border-slate-200 rounded-lg px-6 py-12 text-center">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
              No runs found
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {isAuthenticated
                ? 'You have no saved runs yet. Run a governance scenario to start.'
                : 'Account-linked history is not enabled here. Run a new scenario to continue in the current browser session.'}
            </p>
            <Link
              href="/home"
              className="inline-block bg-slate-200 text-slate-900 font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-white transition-colors"
            >
              Run a scenario
            </Link>
          </div>
        )}

        {/* ── Run list ─────────────────────────────────────────────────────── */}
        {!loading && runs.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4">
              {runs.length} run{runs.length === 1 ? '' : 's'} found
            </p>
            {runs.map(run => (
              <RunCard
                key={run.id}
                run={run}
                onReopen={reopenRun}
                isReopening={reopening === run.id}
              />
            ))}
          </div>
        )}

        {/* ── Assumptions ──────────────────────────────────────────────────── */}
        <div className="mt-8">
          <AssumptionsPanel compact />
        </div>

        {/* ── Audit note ────────────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-200/50">
          <p className="text-[10px] font-mono text-slate-700 leading-relaxed">
            Run storage is best-effort in this public prototype. The interface filters soft-archived rows, but this repository alone does not prove database-enforced immutability or hard-delete prevention.
          </p>
        </div>
      </div>
    </main>
  )
}
