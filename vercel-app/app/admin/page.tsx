'use client'

import { useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Recommendation {
  id: string
  category: 'synthesis_copy' | 'metric_threshold' | 'glossary_language' | 'insight_pattern'
  target: string
  current_value: string
  recommended_value: string
  reasoning: string
  evidence: { run_ids: string[]; observations: string }
  sahi_anchor: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
  reviewed_at: string | null
  learning_cycles: { id: string; run_count: number; runs_analysed: string[]; created_at: string } | null
}

interface Cycle {
  id: string
  run_count: number
  runs_analysed: string[]
  llm_analysis: { patterns_observed: string[] }
  status: string
  created_at: string
  pending_recommendations: { id: string; status: string }[]
}

interface AppliedChange {
  id: string
  category: string
  target: string
  old_value: string
  new_value: string
  applied_by: string
  review_note: string | null
  applied_at: string
  pending_recommendations: { target: string; reasoning: string; sahi_anchor: string | null } | null
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function useAdminAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function login(password: string) {
    setChecking(true)
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setToken(password)
    } else {
      setError('Wrong password')
    }
    setChecking(false)
  }

  return { token, login, checking, error }
}

// ---------------------------------------------------------------------------
// Login screen
// ---------------------------------------------------------------------------

function LoginForm({ onLogin, checking, error }: {
  onLogin: (pw: string) => void
  checking: boolean
  error: string
}) {
  const [pw, setPw] = useState('')
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-neutral-100 text-lg font-semibold">Institutional Mirror — Admin</h1>
        <p className="text-neutral-400 text-sm">
          This dashboard is for authorised reviewers only. Every action is logged.
        </p>
        <input
          type="password"
          placeholder="Admin password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && pw && onLogin(pw)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={() => onLogin(pw)}
          disabled={!pw || checking}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {checking ? 'Checking…' : 'Enter'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Recommendation card
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  synthesis_copy: 'Synthesis copy',
  metric_threshold: 'Metric threshold',
  glossary_language: 'Glossary language',
  insight_pattern: 'Insight pattern',
}

function RecCard({
  rec,
  token,
  onRefresh,
}: {
  rec: Recommendation
  token: string
  onRefresh: () => void
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [localErr, setLocalErr] = useState('')

  async function act(action: 'approve' | 'reject') {
    setBusy(true)
    setLocalErr('')
    const res = await fetch(`/api/admin/recommendations/${rec.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, review_note: note }),
    })
    const data = await res.json()
    if (!res.ok) setLocalErr(data.error ?? 'Error')
    setBusy(false)
    if (res.ok) onRefresh()
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded font-mono mr-2">
            {CATEGORY_LABELS[rec.category] ?? rec.category}
          </span>
          <span className="text-neutral-100 text-sm font-medium">{rec.target}</span>
        </div>
        <span className="text-neutral-500 text-xs whitespace-nowrap">
          {new Date(rec.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-950 rounded-lg p-3 space-y-1">
          <p className="text-neutral-500 text-xs uppercase tracking-wide">Current</p>
          <p className="text-neutral-300 text-sm font-mono break-words">
            {safeDisplay(rec.current_value)}
          </p>
        </div>
        <div className="bg-neutral-950 rounded-lg p-3 space-y-1">
          <p className="text-neutral-500 text-xs uppercase tracking-wide">Proposed</p>
          <p className="text-neutral-200 text-sm font-mono break-words">
            {safeDisplay(rec.recommended_value)}
          </p>
        </div>
      </div>

      <p className="text-neutral-400 text-sm">{rec.reasoning}</p>

      {rec.evidence?.observations && (
        <p className="text-neutral-500 text-xs italic">
          Evidence: {rec.evidence.observations}
          {rec.evidence.run_ids?.length > 0 && ` (runs: ${rec.evidence.run_ids.join(', ')})`}
        </p>
      )}

      {rec.sahi_anchor && (
        <p className="text-blue-400/70 text-xs">{rec.sahi_anchor}</p>
      )}

      {rec.status === 'pending' && (
        <div className="space-y-2 pt-1">
          <textarea
            placeholder="Review note (optional — included in audit log and future LLM context)"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          {localErr && <p className="text-red-400 text-xs">{localErr}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => act('approve')}
              disabled={busy}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {busy ? '…' : 'Approve'}
            </button>
            <button
              onClick={() => act('reject')}
              disabled={busy}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-40 text-neutral-200 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {busy ? '…' : 'Reject'}
            </button>
          </div>
        </div>
      )}

      {rec.status !== 'pending' && (
        <div className="flex items-center gap-2 pt-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            rec.status === 'approved' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
          }`}>
            {rec.status === 'approved' ? 'Approved' : 'Rejected'}
          </span>
          {rec.review_note && (
            <span className="text-neutral-500 text-xs">— {rec.review_note}</span>
          )}
        </div>
      )}
    </div>
  )
}

function safeDisplay(val: string): string {
  try {
    const parsed = JSON.parse(val)
    if (typeof parsed === 'string') return parsed
    return JSON.stringify(parsed, null, 2)
  } catch {
    return val
  }
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const { token, login, checking, error: authError } = useAdminAuth()
  const [tab, setTab] = useState<'pending' | 'cycles' | 'applied'>('pending')
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [applied, setApplied] = useState<AppliedChange[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchErr, setFetchErr] = useState('')

  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  const loadRecs = useCallback(async (status = 'pending') => {
    if (!token) return
    setLoading(true)
    setFetchErr('')
    const res = await fetch(`/api/admin/recommendations?status=${status}`, { headers: authHeader })
    const data = await res.json()
    if (res.ok) setRecs(data.recommendations ?? [])
    else setFetchErr(data.error ?? 'Error loading recommendations')
    setLoading(false)
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCycles = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setFetchErr('')
    const res = await fetch('/api/admin/cycles', { headers: authHeader })
    const data = await res.json()
    if (res.ok) setCycles(data.cycles ?? [])
    else setFetchErr(data.error ?? 'Error loading cycles')
    setLoading(false)
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadApplied = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setFetchErr('')
    const res = await fetch('/api/admin/applied', { headers: authHeader })
    const data = await res.json()
    if (res.ok) setApplied(data.changes ?? [])
    else setFetchErr(data.error ?? 'Error loading applied changes')
    setLoading(false)
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return
    if (tab === 'pending') loadRecs('pending')
    else if (tab === 'cycles') loadCycles()
    else if (tab === 'applied') loadApplied()
  }, [token, tab, loadRecs, loadCycles, loadApplied])

  if (!token) {
    return <LoginForm onLogin={login} checking={checking} error={authError} />
  }

  const pendingCount = recs.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Institutional Mirror — Learning Cycle Admin</h1>
            <span className="text-neutral-500 text-sm">SAHI Rec. 7 — post-deployment monitoring</span>
          </div>
          <p className="text-neutral-400 text-sm">
            Every recommendation was generated by LLM analysis of real simulation runs.
            Nothing changes without your explicit approval. All actions are logged immutably.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-800">
          {[
            { key: 'pending', label: `Pending review${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { key: 'cycles', label: 'Analysis cycles' },
            { key: 'applied', label: 'Applied changes' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && <p className="text-neutral-500 text-sm">Loading…</p>}
        {fetchErr && <p className="text-red-400 text-sm">{fetchErr}</p>}

        {/* Pending recommendations */}
        {tab === 'pending' && !loading && (
          <div className="space-y-4">
            {recs.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                No pending recommendations. The system needs at least 3 simulation runs to trigger analysis.
              </div>
            ) : (
              recs.map(rec => (
                <RecCard key={rec.id} rec={rec} token={token} onRefresh={() => loadRecs('pending')} />
              ))
            )}
          </div>
        )}

        {/* Learning cycles */}
        {tab === 'cycles' && !loading && (
          <div className="space-y-4">
            {cycles.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                No analysis cycles yet.
              </div>
            ) : (
              cycles.map(cycle => {
                const recsByStatus = (cycle.pending_recommendations ?? []).reduce(
                  (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc },
                  {} as Record<string, number>,
                )
                return (
                  <div key={cycle.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-neutral-100 text-sm font-medium">
                          Cycle — {cycle.run_count} runs analysed
                        </span>
                        <div className="flex gap-2 mt-1">
                          {Object.entries(recsByStatus).map(([s, n]) => (
                            <span key={s} className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                              {n} {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-neutral-500 text-xs">
                        {new Date(cycle.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {cycle.llm_analysis?.patterns_observed?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-neutral-500 text-xs uppercase tracking-wide">Patterns observed</p>
                        <ul className="space-y-1">
                          {cycle.llm_analysis.patterns_observed.map((p, i) => (
                            <li key={i} className="text-neutral-400 text-sm">— {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Applied changes */}
        {tab === 'applied' && !loading && (
          <div className="space-y-4">
            {applied.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                No changes have been applied yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500 text-xs uppercase tracking-wide">
                      <th className="text-left py-2 pr-4">Target</th>
                      <th className="text-left py-2 pr-4">Category</th>
                      <th className="text-left py-2 pr-4">Old value</th>
                      <th className="text-left py-2 pr-4">New value</th>
                      <th className="text-left py-2">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {applied.map(ch => (
                      <tr key={ch.id} className="text-neutral-300">
                        <td className="py-3 pr-4 font-mono text-xs">{ch.target}</td>
                        <td className="py-3 pr-4 text-neutral-500 text-xs">
                          {CATEGORY_LABELS[ch.category] ?? ch.category}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-neutral-500 max-w-[140px] truncate">
                          {safeDisplay(ch.old_value)}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs max-w-[140px] truncate">
                          {safeDisplay(ch.new_value)}
                        </td>
                        <td className="py-3 text-neutral-500 text-xs whitespace-nowrap">
                          {new Date(ch.applied_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
